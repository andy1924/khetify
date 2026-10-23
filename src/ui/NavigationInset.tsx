import { createContext, useContext } from 'react';

/** Space occupied by the floating navigation, including the device safe area. */
export const NavigationInsetContext = createContext(0);

export function useNavigationInset() {
  return useContext(NavigationInsetContext);
}
