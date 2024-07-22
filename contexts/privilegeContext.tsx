import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { RedeemDetailPreview } from "../interfaces/Privilege/redeemDetails";
import { RedeemHistoryInput } from "../interfaces/Privilege/redeemHistory";
import { trpc } from "../utils/trpc";

type privilegeContextType = {
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
  selectedItem: RedeemDetailPreview | null;
  setSelectedItem: Dispatch<SetStateAction<RedeemDetailPreview | null>>;
  redeem: () => void;
  back: (to: number) => void;
  checkout: (data: RedeemHistoryInput) => void;
  openRedeemDetailDialog: (detail: RedeemDetailPreview) => void;
  orderId?: string | null;
  updatingHistory: boolean;
  updateHistoryError: boolean;
};

const privilegeContextDefaultValue: privilegeContextType = {
  step: 0,
  setStep: () => {},
  selectedItem: null,
  setSelectedItem: () => {},
  redeem: () => {},
  back: () => {},
  checkout: () => {},
  openRedeemDetailDialog: () => {},
  orderId: undefined,
  updatingHistory: false,
  updateHistoryError: false,
};

const PrivilegeContext = createContext<privilegeContextType>(
  privilegeContextDefaultValue
);

type Props = {
  children: ReactNode;
};

export function PrivilegeProvider({ children }: Props) {
  const [selectedItem, setSelectedItem] = useState<RedeemDetailPreview | null>(
    null
  );

  const [step, setStep] = useState<number>(0);

  //TRPC
  const {
    data: orderId,
    mutate: updateHistory,
    isLoading: updatingHistory,
    isSuccess: updateHistorySuccess,
    isError: updateHistoryError,
  } = trpc.privilege.redeemHistoryCreate.useMutation();

  const openRedeemDetailDialog = (detail: RedeemDetailPreview) => {
    setSelectedItem(detail);
    window.redeem_item_detail.showModal();
  };

  //EFFECTs
  useEffect(() => {
    if (updateHistorySuccess) {
      setStep(2);
    }
  }, [updateHistorySuccess]);

  const redeem = () => {
    setStep(1);
  };
  const checkout = (data: RedeemHistoryInput) => {
    if (step != 1) {
      console.log("need step = 1 currently is ", step);
      return;
    }

    updateHistory({
      ...data,
      timestamp: new Date().toISOString(),
    });
  };
  const back = (to: number) => {
    setStep(to);
  };

  const value = {
    step,
    setStep,
    selectedItem,
    setSelectedItem,
    redeem,
    back,
    checkout,
    openRedeemDetailDialog,
    orderId,
    updatingHistory,
    updateHistoryError,
  };

  return (
    <PrivilegeContext.Provider value={value}>
      {children}
    </PrivilegeContext.Provider>
  );
}

export function usePrivilege() {
  return useContext(PrivilegeContext);
}
