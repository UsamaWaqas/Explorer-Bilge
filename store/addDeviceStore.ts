import { create } from "zustand";

export type DeviceForm = {
  activationCode: string;
  deviceName: string;
  deviceLocation: string;
  image: string;
  verified: boolean;
  productName: string;
  lastVerifiedCode: string;
};

export type DeviceErrors = {
  activationCode?: string;
  deviceName?: string;
  deviceLocation?: string;
  image?: string;
};

export const emptyDevice = (): DeviceForm => ({
  activationCode: "",
  deviceName: "",
  deviceLocation: "",
  image: "",
  verified: false,
  productName: "",
  lastVerifiedCode: "",
});

type AddDeviceStore = {
  devices: DeviceForm[];
  errors: DeviceErrors[];
  setDevices: (devices: DeviceForm[]) => void;
  setErrors: (errors: DeviceErrors[]) => void;
  resetStore: () => void;
};

export const useAddDeviceStore = create<AddDeviceStore>((set) => ({
  devices: [emptyDevice()],
  errors: [{}],
  setDevices: (devices) => set({ devices }),
  setErrors: (errors) => set({ errors }),
  resetStore: () => set({ devices: [emptyDevice()], errors: [{}] }),
}));