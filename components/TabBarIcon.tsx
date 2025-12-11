import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

type TabBarIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

export default function TabBarIcon({ name, color }: TabBarIconProps) {
  return <Ionicons name={name} size={24} color={color} />;
}
