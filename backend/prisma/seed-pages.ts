import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const pages = [
    {
      title: 'About Us',
      slug: 'about',
      content: `
        <h2>Our Heritage</h2>
        <p>James & Sons has been a purveyor of the world's most exquisite luxury illumination for decades. Born from a deeply ingrained passion for heritage craftsmanship, our collections are meticulously curated to bring timeless elegance into modern spaces.</p>
        <br/>
        <h2>Our Process</h2>
        <p>We partner directly with masterful artisans globally, ensuring every chandelier, sconce, and flush mount meets our exacting standards of quality. Each piece tells a unique story—combining premium materials with visionary design.</p>
      `,
      metaTitle: 'About Us | James & Sons',
      metaDescription: 'Learn about the heritage and craftsmanship behind James & Sons luxury illumination.'
    },
    {
      title: 'Contact Us',
      slug: 'contact',
      content: `
        <h2>Get in Touch</h2>
        <p>We are here to assist you with any inquiries regarding our collections, your orders, or custom design needs.</p>
        <br/>
        <strong>Email:</strong> support@jamesandsons.com<br/>
        <strong>Phone:</strong> +91 1800-419-LUXE<br/>
        <br/>
        <h2>Visit Our Showroom</h2>
        <p>Experience our collections in person at our flagship gallery.</p>
        <p>123 Heritage Boulevard, New Delhi, 110001, India</p>
      `,
      metaTitle: 'Contact Us | James & Sons',
      metaDescription: 'Get in touch with James & Sons for support, custom requests, and showroom visits.'
    },
    {
      title: 'Careers',
      slug: 'careers',
      content: `
        <h2>Join the Legacy</h2>
        <p>At James & Sons, we are always searching for talented, passionate individuals who appreciate fine craftsmanship and luxury retail.</p>
        <br/>
        <p>We currently have no open positions. However, we are always happy to connect with visionary talent. Please send your resume and portfolio to careers@jamesandsons.com.</p>
      `,
      metaTitle: 'Careers | James & Sons',
      metaDescription: 'Join the team at James & Sons.'
    },
    {
      title: 'Terms & Conditions',
      slug: 'terms-and-conditions',
      content: `
        <h2>1. Introduction</h2>
        <p>Welcome to James & Sons. By accessing our website, you agree to be bound by these Terms & Conditions. Please read them carefully before making a purchase.</p>
        <br/>
        <h2>2. Intellectual Property</h2>
        <p>All content published and made available on this site is the property of James & Sons and the site's creators. This includes, but is not limited to images, text, logos, documents, downloadable files and anything that contributes to the composition of our site.</p>
        <br/>
        <h2>3. Sale of Goods</h2>
        <p>These Terms & Conditions govern the sale of goods available on our site. We are under a legal duty to supply goods that match the description of the good(s) you order on our site.</p>
        <br/>
        <h2>4. Pricing and Payments</h2>
        <p>All prices are listed in Indian Rupees (INR). We reserve the right to modify prices, delivery charges, and services offered at any time.</p>
      `,
      metaTitle: 'Terms & Conditions | James & Sons',
      metaDescription: 'Terms and conditions for purchasing from James & Sons.'
    },
    {
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: `
        <h2>1. Overview</h2>
        <p>James & Sons respects your privacy and is committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>
        <br/>
        <h2>2. Data Collection</h2>
        <p>We may collect, use, store and transfer different kinds of personal data about you, including Identity Data, Contact Data, Financial Data, and Transaction Data.</p>
        <br/>
        <h2>3. Use of Data</h2>
        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to perform the contract we are about to enter into or have entered into with you.</p>
      `,
      metaTitle: 'Privacy Policy | James & Sons',
      metaDescription: 'Privacy policy and data handling practices at James & Sons.'
    },
    {
      title: 'Shipping Policy',
      slug: 'shipping-policy',
      content: `
        <h2>Domestic Shipping</h2>
        <p>We offer complimentary secure shipping across India for all major orders. Standard delivery timelines range between 7-14 business days, dependent on the fragility and scale of the lighting fixture.</p>
        <br/>
        <h2>White-Glove Installation</h2>
        <p>For specific grand-scale chandeliers, we offer complimentary white-glove installation services by our expert technicians within major metros. Please contact support for scheduling.</p>
        <br/>
        <h2>International Shipping</h2>
        <p>We currently only ship B2B orders internationally on a customized freight basis. D2C international shipping is not available directly through the web portal.</p>
      `,
      metaTitle: 'Shipping Policy | James & Sons',
      metaDescription: 'Information about domestic and international shipping with James & Sons.'
    },
    {
      title: 'Returns & Refunds',
      slug: 'returns',
      content: `
        <h2>Return Eligibility</h2>
        <p>Due to the delicate and high-value nature of luxury lighting, returns are only accepted within 7 days of delivery <strong>if the product arrives physically damaged or materially defective</strong>.</p>
        <br/>
        <h2>Process</h2>
        <p>To initiate a return request, please use the Support Tickets portal within your Account dashboard or email us directly at support@jamesandsons.com within 48 hours of unpacking along with photographic evidence.</p>
        <br/>
        <h2>B2B Specifics</h2>
        <p>Bulk orders placed through the B2B portal are bound by their specific master service agreements and are generally non-refundable unless specified otherwise prior to invoicing.</p>
      `,
      metaTitle: 'Returns & Refunds | James & Sons',
      metaDescription: 'Returns and refunds policy for James & Sons chandeliers.'
    }
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
    console.log(`Successfully seeded page: ${page.slug}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
