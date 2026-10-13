import { FileIcon, HomeIcon, MapIcon, PlusIcon, UserIcon } from './icons';
 
// Shared by the mobile bottom bar and the desktop sidebar.
export const NAV_ITEMS = [
  { name: 'home', label: 'Home', Icon: HomeIcon },
  { name: 'map', label: 'Map', Icon: MapIcon },
  { name: 'report', label: 'Report', Icon: PlusIcon, primary: true },
  { name: 'myreports', label: 'My Reports', Icon: FileIcon },
  { name: 'profile', label: 'Profile', Icon: UserIcon },
];
 