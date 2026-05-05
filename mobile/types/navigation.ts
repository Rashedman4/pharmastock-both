export type AuthStackParamList = {
  splash: undefined;
  login: undefined;
  register: undefined;
  verify: { email: string };
  'forgot-password': undefined;
  'reset-password': { token: string };
};

export type TabsParamList = {
  home: undefined;
  portfolio: undefined;
  alerts: undefined;
  community: undefined;
  profile: undefined;
};
