interface LoadingProps {
  size: "xs" | "sm" | "md" | "lg";
}
const Loading = ({ size = "sm" }: LoadingProps) => {
  return (
    <>
      <span className={`loading loading-infinity loading-${size}`}></span>
    </>
  );
};

export default Loading;
