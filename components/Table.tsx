import React, { useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import CustomDropdown from "./Select";
import { Ionicons } from "@expo/vector-icons";

export interface ColumnType<T> {
  key: keyof T;
  label: string;
  width: number;
  render?: (item: T) => React.ReactNode;
}

interface GlobalTableProps<T> {
  columns: ColumnType<T>[];
  data: T[];
  maxHeight?: number;
  defaultRowsPerPage?: number;
  totalRows?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (limit: number) => void;
  isLoading?: boolean;
}

function GlobalTable<T>({
  columns,
  data,
  maxHeight = 320,
  defaultRowsPerPage = 10,
  totalRows,
  currentPage: externalPage,
  onPageChange,
  onRowsPerPageChange,
  isLoading = false,
}: GlobalTableProps<T>) {
  const isServerSide = totalRows !== undefined && onPageChange !== undefined;

  const [internalPage, setInternalPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const page = isServerSide ? (externalPage ?? 1) : internalPage;

  useEffect(() => {
    if (!isServerSide) setInternalPage(1);
  }, [data, rowsPerPage]);

  const total = isServerSide ? (totalRows ?? 0) : data.length;
  const totalPages = Math.ceil(total / rowsPerPage);

  const paginatedData = useMemo(() => {
    if (isServerSide) return data;
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [page, data, rowsPerPage, isServerSide]);

  const startItem = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endItem = Math.min(page * rowsPerPage, total);

  function handlePrev() {
    if (page <= 1) return;
    if (isServerSide) onPageChange?.(page - 1);
    else setInternalPage((p) => p - 1);
  }

  function handleNext() {
    if (page >= totalPages) return;
    if (isServerSide) onPageChange?.(page + 1);
    else setInternalPage((p) => p + 1);
  }

  function handleRowsPerPageChange(val: number) {
    setRowsPerPage(val);
    if (isServerSide) {
      onPageChange?.(1);
      onRowsPerPageChange?.(val);
    } else {
      setInternalPage(1);
    }
  }

  const rowOptions = [
    { label: "10", value: 10 },
    { label: "25", value: 25 },
    { label: "50", value: 50 },
  ];

  return (
    <View className="flex border overflow-hidden border-gray-300 rounded-md">

      {/* Horizontal Scroll — only for header + rows */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>

          {/* Header */}
          <View className="flex-row">
            {columns.map((col, index) => (
              <View
                key={`header-${index}`}
                style={{ width: col.width }}
                className={`px-3 py-2.5 bg-gray-200 ${
                  index < columns.length - 1 ? "border-r border-gray-300" : ""
                }`}
              >
                <Text className="text-xs font-semibold text-gray-700">
                  {col.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Rows — only shown when data exists and not loading */}
          {!isLoading && paginatedData.length > 0 && (
            <ScrollView
              style={{ maxHeight }}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {paginatedData.map((item, rowIndex) => (
                <View
                  key={`row-${rowIndex}`}
                  className={`flex-row ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  {columns.map((col, colIndex) => (
                    <View
                      key={`cell-${rowIndex}-${colIndex}`}
                      style={{ width: col.width }}
                      className={`px-3 py-2.5 border-b border-gray-200 justify-center ${
                        colIndex < columns.length - 1 ? "border-r border-gray-200" : ""
                      }`}
                    >
                      {col.render ? (
                        col.render(item)
                      ) : (
                        <Text className="text-xs text-gray-700">
                          {String(item[col.key] ?? "")}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}

        </View>
      </ScrollView>

      {/* ✅ Loading & Empty state OUTSIDE horizontal scroll — centers on screen */}
      {isLoading ? (
        <View className="py-10 items-center justify-center">
          <ActivityIndicator size="large" color="#2C64B3" />
        </View>
      ) : paginatedData.length === 0 ? (
        <View className="py-10 items-center justify-center">
          <Text className="text-sm text-gray-400">No data available</Text>
        </View>
      ) : null}

      {/* Footer */}
      <View className="flex-row items-center justify-end px-3 py-2 border-t border-gray-200 bg-white">

        <Text className="text-xs text-gray-500 mr-1.5">Rows per page:</Text>

        <CustomDropdown
          data={rowOptions}
          value={rowsPerPage}
          onChange={(val) => handleRowsPerPageChange(Number(val))}
          placeholder="10"
          style={{ width: 65 }}
          compact
          noFloatingLabel
        />

        <View className="w-px h-4 bg-gray-200 mx-3" />

        <Text className="text-xs text-gray-500 min-w-[80px] text-center">
          {startItem}–{endItem} of {total}
        </Text>

        <View className="w-px h-4 bg-gray-200 mx-3" />

        <Pressable
          onPress={handlePrev}
          disabled={page <= 1}
          className={`p-1 rounded active:bg-gray-100 ${page <= 1 ? "opacity-30" : "opacity-100"}`}
        >
          <Ionicons name="chevron-back" size={18} color="#374151" />
        </Pressable>

        <Pressable
          onPress={handleNext}
          disabled={page >= totalPages}
          className={`p-1 rounded active:bg-gray-100 ${page >= totalPages ? "opacity-30" : "opacity-100"}`}
        >
          <Ionicons name="chevron-forward" size={18} color="#374151" />
        </Pressable>

      </View>
    </View>
  );
}

export default GlobalTable;