// src/components/dashboard/DashboardSkeleton.tsx

import { View } from "react-native";
import SkeletonShimmer from "../SkeletonBox";

export const TileSkeletons = () => (
  <View className="flex-row flex-wrap gap-y-3 justify-between">
    <SkeletonShimmer width="48.5%" height={120} />
    <SkeletonShimmer width="48.5%" height={120} />
    <SkeletonShimmer width="48.5%" height={120} />
    <SkeletonShimmer width="48.5%" height={120} />
  </View>
);

export const DashboardSkeleton = () => (
  <View className="flex-1 bg-white px-4 pt-4">
    <View className="flex-row items-center gap-3 mb-3">
      <SkeletonShimmer width={160} height={20} borderRadius={4} />
      <SkeletonShimmer width={150} height={36} borderRadius={6} />
    </View>
    <View className="mb-6">
      <TileSkeletons />
    </View>
    <SkeletonShimmer width={140} height={20} borderRadius={4} />
    <View className="mt-3">
      <TileSkeletons />
    </View>
  </View>
);