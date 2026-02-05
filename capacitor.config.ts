import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solotask.app',
  appName: 'Solo Task',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample", // اختياري
      iconColor: "#FF0000",
      sound: "beep.wav",
    },
  },
};

export default config;
