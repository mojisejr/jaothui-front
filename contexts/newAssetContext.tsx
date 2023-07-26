import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type newAssetContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const newAssetContextDefaultValue: newAssetContextType = {
  isOpen: false,
  open: () => {},
  close: () => {},
};

const NewAssetContext = createContext<newAssetContextType>(
  newAssetContextDefaultValue
);

type Props = {
  children: ReactNode;
};

export function NewAssetProvider({ children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, []);

  function open() {
    if (isOpen == false) {
      setIsOpen(true);
    }
  }

  function close() {
    if (isOpen == true) {
      setIsOpen(false);
    }
  }

  const value = {
    isOpen,
    open,
    close,
  };

  return (
    <NewAssetContext.Provider value={value}>
      {children}
    </NewAssetContext.Provider>
  );
}

export function useNewAsset() {
  return useContext(NewAssetContext);
}
