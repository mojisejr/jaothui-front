import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type menuContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const menuContextDefaultValue: menuContextType = {
  isOpen: false,
  open: () => {},
  close: () => {},
};

const MenuContext = createContext<menuContextType>(menuContextDefaultValue);

type Props = {
  children: ReactNode;
};

export function MenuProvider({ children }: Props) {
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

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  return useContext(MenuContext);
}
