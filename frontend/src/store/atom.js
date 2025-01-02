import { atom } from 'recoil';

export const logoutState = atom({
  key: 'logoutState', // unique ID (with respect to other atoms/selectors)
  default: true, // default value (initial value)
});

export const schoolState = atom({
  key: 'schoolState',
  default: null
});

export const studentState = atom({
  key: 'studentState',
  default: null
});