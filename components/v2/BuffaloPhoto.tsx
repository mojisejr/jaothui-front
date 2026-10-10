import { RemoteImage, type RemoteImageProps } from "./RemoteImage";

export type BuffaloPhotoProps = Pick<
  RemoteImageProps,
  "src" | "alt" | "sizes" | "priority" | "fallback"
>;

/** Identity photos show the entire source, unlike decorative covers and avatars.
 * The 4px inset clears a 12px rounded photo clip, even for edge-filled sources.
 * Parent owns the fixed geometry/background; callers cannot add crop or zoom.
 */
export function BuffaloPhoto(props: BuffaloPhotoProps) {
  return (
    <RemoteImage
      key={props.src || "missing"}
      {...props}
      className="object-contain object-center p-1"
    />
  );
}
