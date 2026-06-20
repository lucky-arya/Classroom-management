import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { CLOUDINARY_CLOUD_NAME } from "@/constants";

// Singleton cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: CLOUDINARY_CLOUD_NAME,
  },
});

/**
 * Returns a Cloudinary image optimized for banner display (wide aspect ratio)
 */
export function bannerPhoto(publicId: string, _alt?: string) {
  const img = cld.image(publicId);
  img.resize(fill().width(1200).height(240));
  return img;
}

export { cld };
