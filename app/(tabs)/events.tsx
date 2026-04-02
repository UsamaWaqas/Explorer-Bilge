// src/screens/Events.tsx

import { View } from "react-native";
import GlobalTable from "../../components/Table";
import { useEventColumns } from "../../components/Events/EventColumns"
import { EventsHeader } from "../../components/Events/EventsHeader"
import { usePackets } from "../../hooks/usePackets";

export default function Events() {
  const {
    rows,
    totalRows,
    isFetching,
    eventType,
    paginationParams,
    handleEventTypeChange,
    handlePageChange,
    handleRowsPerPageChange,
    getIsAlert,
    getAlertTimes,
  } = usePackets();

  const columns = useEventColumns({ rows, getIsAlert, getAlertTimes });

  return (
    <View className="flex-1 bg-white py-3">
      <View className="flex-1">

        {/* Header */}
        <EventsHeader
          eventType={eventType}
          onEventTypeChange={handleEventTypeChange}
        />

        {/* Table */}
        <View>
          <GlobalTable
            columns={columns}
            data={rows}
            defaultRowsPerPage={paginationParams.limit}
            totalRows={totalRows}
            currentPage={paginationParams.currentPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            isLoading={isFetching}
          />
        </View>

      </View>
    </View>
  );
}