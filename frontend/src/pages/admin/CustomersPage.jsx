import { useMemo, useState } from "react";
import { FiSearch, FiUserCheck, FiUserX } from "react-icons/fi";
import { toast } from "sonner";
import Button from "../../components/ui/Button.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import SelectField from "../../components/ui/SelectField.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { EmptyState, ErrorState, TableSkeleton } from "../../components/ui/StateViews.jsx";
import useDebounce from "../../hooks/useDebounce.js";
import useFetch from "../../hooks/useFetch.js";
import * as adminService from "../../services/adminService.js";
import { formatDate } from "../../utils/format.js";
import { getErrorMessage } from "../../utils/getErrorMessage.js";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deactivating, setDeactivating] = useState(null);

  const q = useDebounce(search);
  const params = useMemo(() => ({ page, limit: 10, q: q || undefined, isActive: activeFilter || undefined }), [page, q, activeFilter]);
  const { data, loading, error, reload } = useFetch(() => adminService.listCustomers(params), [params]);
  const items = data?.items ?? [];
  const filtered = Boolean(q || activeFilter);

  const changeStatus = async (customer, isActive) => {
    await adminService.setCustomerActive(customer.id, isActive);
    toast.success(isActive ? `${customer.name} activated` : `${customer.name} deactivated`);
    reload();
  };

  const handleActivate = async (customer) => {
    try {
      await changeStatus(customer, true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader title="Customers" description="Registered customer accounts. Deactivated customers cannot log in." />

      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input type="search" aria-label="Search customers" placeholder="Name, email or phone…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 outline-none focus:border-red-800 focus:ring-2 focus:ring-red-800/30" />
          </div>
          <div className="sm:w-48">
            <SelectField hideLabel label="Filter by account status" name="activeFilter" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }} placeholder="All accounts"
              options={[{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }]} />
          </div>
        </div>

        {loading && !data && <TableSkeleton />}
        {error && !data && <ErrorState message={error} onRetry={reload} />}
        {error && data && <div role="alert" className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-800">{error} <button className="underline" onClick={reload}>Retry</button></div>}
        {data && items.length === 0 && <EmptyState title={filtered ? "No customers match your search" : "No customers yet"} hint={filtered ? "Try a different search." : "Customers appear here after they register."} />}

        {items.length > 0 && (
          <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
                <tr>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Phone</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Bookings</th>
                  <th className="hidden px-5 py-3 font-medium lg:table-cell">Joined</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3"><p className="font-medium">{c.name}</p><p className="text-xs text-stone-500">{c.email}</p></td>
                    <td className="hidden whitespace-nowrap px-5 py-3 md:table-cell">{c.phone || "—"}</td>
                    <td className="hidden px-5 py-3 sm:table-cell">{c._count.bookings}</td>
                    <td className="hidden whitespace-nowrap px-5 py-3 lg:table-cell">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                    <td className="px-5 py-3 text-right">
                      {c.isActive ? (
                        <Button variant="secondary" size="sm" onClick={() => setDeactivating(c)} aria-label={`Deactivate ${c.name}`}><FiUserX /> Deactivate</Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handleActivate(c)} aria-label={`Activate ${c.name}`}><FiUserCheck /> Activate</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination pagination={data?.pagination} onPageChange={setPage} />
      </div>

      {deactivating && (
        <ConfirmDialog
          danger
          title="Deactivate customer?"
          message={`${deactivating.name} will no longer be able to log in. Their bookings are kept. You can reactivate the account at any time.`}
          confirmLabel="Deactivate"
          onConfirm={async () => { await changeStatus(deactivating, false); setDeactivating(null); }}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </>
  );
}
