interface LoadingScreenProps {
  message?: string;
}
const LoadingScreen = ({ message }: LoadingScreenProps) => {
  return (
    <div className="fixed top-0 left-0 min-h-screen w-full bg-thuidark bg-opacity-80 flex justify-center items-center z-[10]">
      <div className="text-3xl text-thuiwhite">
        {message == undefined ? "Loading ..." : message}
      </div>
    </div>
  );
};

export default LoadingScreen;
