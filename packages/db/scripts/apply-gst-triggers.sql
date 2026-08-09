-- PostgreSQL Immutability and Month Lock Triggers for Indian GST Compliance
-- Run on Supabase / PostgreSQL database

-- 1. Prevent locked invoice mutation trigger function
CREATE OR REPLACE FUNCTION public.prevent_locked_invoice_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- Block modifications if invoice is marked as locked
    IF OLD.is_locked = TRUE THEN
        RAISE EXCEPTION 'GST COMPLIANCE ERROR: Cannot modify or delete financial records of a locked Tax Invoice (ID: %). Use a Credit Note under CGST Section 34.', OLD.id;
    END IF;

    -- Block modifications if financial period is closed
    IF OLD.financial_period_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.financial_periods WHERE id = OLD.financial_period_id AND is_closed = TRUE) THEN
            RAISE EXCEPTION 'GST COMPLIANCE ERROR: Financial period for Invoice % is CLOSED. Direct mutation prohibited.', OLD.invoice_number;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to invoices table
DROP TRIGGER IF EXISTS trg_prevent_invoice_mutation ON public.invoices;
CREATE TRIGGER trg_prevent_invoice_mutation
BEFORE UPDATE OF subtotal_amount, tax_amount, total_invoice_amount, cgst_amount, sgst_amount, igst_amount, is_locked
OR DELETE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.prevent_locked_invoice_mutation();

-- 2. Automatic invoice locking trigger function on financial period closing
CREATE OR REPLACE FUNCTION public.lock_invoices_on_period_close()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_closed = TRUE AND OLD.is_closed = FALSE THEN
        UPDATE public.invoices
        SET is_locked = TRUE,
            locked_at = NOW()
        WHERE financial_period_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_invoices_on_period_close ON public.financial_periods;
CREATE TRIGGER trg_lock_invoices_on_period_close
AFTER UPDATE OF is_closed ON public.financial_periods
FOR EACH ROW
EXECUTE FUNCTION public.lock_invoices_on_period_close();
