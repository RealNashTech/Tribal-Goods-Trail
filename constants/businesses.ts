export type BusinessLocation = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
};

export const businessLocations: BusinessLocation[] = [
  {
    id: 'not-listed',
    name: 'Not Listed',
    category: 'Arts & Culture',
    latitude: 46.404889,
    longitude: -116.804861,
    address: 'Not Listed',
  },
  {
    id: 'advanced-tribal',
    name: 'Advanced Tribal',
    category: 'Construction / Trades / Home Services',
    latitude: 45.491417,
    longitude: -122.678583,
    address: 'Portland, OR (Not Listed)',
  },
  {
    id: 'against-the-current-consulting',
    name: 'Against The Current Consulting',
    category: 'Professional Services',
    latitude: 47.646967,
    longitude: -122.534561,
    address: 'Seattle, WA (Not Listed)',
  },
  {
    id: 'allsop-printing',
    name: 'Allsop Printing',
    category: 'Creative Services',
    latitude: 47.98702,
    longitude: -122.08572,
    address: 'Not Listed',
  },
  {
    id: 'bear-north-contracting',
    name: 'Bear North Contracting Services',
    category: 'Construction / Trades / Home Services',
    latitude: 45.6555,
    longitude: -122.6309,
    address: 'Vancouver, WA (Not Listed)',
  },
  {
    id: 'blue-earth-federal-corporation',
    name: 'Blue Earth Federal Corporation',
    category: 'Professional Services',
    latitude: 45.472,
    longitude: -122.681,
    address: 'Not Listed',
  },
  {
    id: 'cayuse-native-solutions',
    name: 'Cayuse Native Solutions',
    category: 'Tribal Enterprises',
    latitude: 45.644722,
    longitude: -118.686583,
    address: 'Not Listed',
  },
  {
    id: 'clearwater-river-casino',
    name: 'Clearwater River Casino & Lodge',
    category: 'Tribal Enterprises',
    latitude: 46.436222,
    longitude: -116.908333,
    address: 'Not Listed',
  },
  {
    id: 'coral-story-beauty',
    name: 'Coral Story Beauty',
    category: 'Retail & Consumer Goods',
    latitude: 45.505803,
    longitude: -122.634405,
    address: 'Not Listed',
  },
  {
    id: 'digital-native-consultants',
    name: 'Digital Native Consultants',
    category: 'Creative Services',
    latitude: 45.445806,
    longitude: -122.717444,
    address: 'Not Listed',
  },
  {
    id: 'ginew',
    name: 'Ginew',
    category: 'Retail & Consumer Goods',
    latitude: 45.530528,
    longitude: -122.616806,
    address: 'Not Listed',
  },
  {
    id: 'sky-bear-media',
    name: 'Sky Bear Media',
    category: 'Creative Services',
    latitude: 47.0458,
    longitude: -122.8995,
    address: 'Olympia, WA',
  },
];
