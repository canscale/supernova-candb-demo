import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { visuallyHidden } from '@mui/utils';
import { PKMetrics } from '../pages/CanisterMonitoringPage';

interface Data {
  pk: string;
  canisterId: string;
  heapSize: bigint;
  entityCount: bigint;
  cycles: bigint;
  scalingStatus: 'not scaled' | 'scaled';
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof Data>(
  order: Order,
  orderBy: Key,
): (
  a: { [key in Key]: bigint | string },
  b: { [key in Key]: bigint | string },
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
  align?: 'right';
}

const headCells: readonly HeadCell[] = [
  {
    id: 'pk',
    numeric: false,
    disablePadding: true,
    label: 'Partition Key',
  },
  {
    id: 'canisterId',
    numeric: false,
    disablePadding: false,
    label: 'Canister Id',
  },
  {
    id: 'scalingStatus',
    numeric: false,
    disablePadding: false,
    label: 'Auto-Scaling Status',
  },
  {
    id: 'heapSize',
    numeric: true,
    disablePadding: false,
    label: 'Heap Utilized (bytes)',
    align: 'right'
  },
  {
    id: 'entityCount',
    numeric: true,
    disablePadding: false,
    label: 'Entity Count (rows',
    align: 'right'
  },
  {
    id: 'cycles',
    numeric: true,
    disablePadding: false,
    label: 'Cycles Remaining (Billions)',
    align: 'right'
  },
];

interface CanisterMetricsTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function CanisterMetricsTableHead(props: CanisterMetricsTableProps) {
  const { order, orderBy, rowCount, onRequestSort } =
    props;
  const createSortHandler =
    (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}


export default function CanisterMetricsTable(pkMetrics: PKMetrics) {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Data>('pk');
  // const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  function createRowsFromMetrics(): Data[] {
    const rows: Data[] = [];
    Object.keys(pkMetrics).forEach(pk => {
      const canisterMetricMapping = pkMetrics[pk]
      Object.keys(canisterMetricMapping).forEach(canisterId => {
        const { heapSize, entityCount, cycles, scalingStatus } = canisterMetricMapping[canisterId];
        const status = 'complete' in scalingStatus ? 'scaled' : 'not scaled'
        rows.push({
          pk,
          canisterId,
          heapSize,
          entityCount,
          cycles,
          scalingStatus: status
        })
      })
    });

    return rows;
  }

  const rows = createRowsFromMetrics();

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <TableContainer sx={{maxHeight: 440}}>
          <Table stickyHeader aria-label="sticky table"
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
          >
            <CanisterMetricsTableHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {/* if you don't need to support IE11, you can replace the `stableSort` call with:
              rows.slice().sort(getComparator(order, orderBy)) */}
              {stableSort(rows, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={row.canisterId as string}
                    >
                      { headCells.map(column => {
                        const value = row[column.id];
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {typeof value === 'bigint'
                              ? column.id === 'cycles'
                                ? Number(value/BigInt(1000000000)).toFixed(1)
                                : value.toString()
                              : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 53 * emptyRows,
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
