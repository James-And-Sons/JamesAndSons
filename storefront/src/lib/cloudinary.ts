/**
 * Custom Next.js Image Loader for Cloudinary
 * Constructs responsive, optimized Cloudinary URLs globally.
 * Optimizes formats (f_auto -> AVIF/WebP) and compression (q_auto:good) at the CDN edge.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // If src is a local path or not from Cloudinary, pass it through untouched
  if (!src.includes('res.cloudinary.com')) {
    return src;
  }

  // Define quality mapping (default to q_auto:good)
  const qualityParam = quality ? `q_${quality}` : 'q_auto:good';
  
  // Base transform params: auto-format, auto-quality, responsive width
  // dpr_auto handles high-density screens natively
  const params = ['f_auto', qualityParam, `w_${width}`, 'c_limit', 'dpr_auto'];

  // Parse the URL: https://res.cloudinary.com/[cloud_name]/image/upload/[options]/[version]/[public_id]
  const cleanSrc = src.replace('http://', 'https://');
  const parts = cleanSrc.split('/image/upload/');
  
  if (parts.length === 2) {
    const baseUrl = parts[0];
    const rest = parts[1];
    
    // Check if the URL already has some options specified
    // E.g. c_scale,w_400/v1234/public_id
    const restParts = rest.split('/');
    
    // If the first part matches common cloudinary options format (has underscores, commas, or specific transforms)
    // and isn't a version string (which typically starts with 'v' followed by digits)
    const hasOptions = 
      restParts[0].includes('_') || 
      restParts[0].includes(',') || 
      /^(?:[a-z]{1,2}_[a-z0-9]+)$/.test(restParts[0]);
    
    if (hasOptions) {
      // Remove existing dimensions/quality options to let Next.js control width
      const existingOptions = restParts[0].split(',');
      const filteredOptions = existingOptions.filter(
        opt => !opt.startsWith('w_') && !opt.startsWith('q_') && !opt.startsWith('f_') && !opt.startsWith('dpr_')
      );
      
      const mergedParams = [...params, ...filteredOptions].join(',');
      restParts[0] = mergedParams;
      return `${baseUrl}/image/upload/${restParts.join('/')}`;
    } else {
      // Insert our optimized params
      return `${baseUrl}/image/upload/${params.join(',')}/${rest}`;
    }
  }

  return src;
}
