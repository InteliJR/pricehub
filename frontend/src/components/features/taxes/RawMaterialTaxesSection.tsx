// src/components/features/taxes/RawMaterialTaxesSection.tsx

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { RawMaterialTax } from "@/types/taxes";
import { PageHeader } from "./PageHeader";
import { RawMaterialTaxesTable } from "./RawMaterialTaxesTable";
import { RawMaterialTaxModal } from "./RawMaterialTaxModal";
import { ExportModal } from "./ExportModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import {
  useRawMaterialTaxesQuery,
  useDeleteRawMaterialTaxMutation,
  useExportRawMaterialTaxesMutation,
} from "@/api/taxes";
import { useDebounce } from "@/hooks/useDebounce";
import { triggerCsvDownload } from "@/lib/utils";

const EXPORT_COLUMNS = [
  { key: "name", label: "Nome do Imposto" },
  { key: "rate", label: "Taxa (%)" },
  { key: "recoverable", label: "Recuperável" },
  { key: "rawMaterialName", label: "Matéria-Prima" },
  { key: "rawMaterialCode", label: "Código" },
  { key: "createdAt", label: "Data de Criação" },
];

export function RawMaterialTaxesSection() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<RawMaterialTax | null>(null);
  const [deletingTaxId, setDeletingTaxId] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useRawMaterialTaxesQuery({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteRawMaterialTaxMutation();
  const exportMutation = useExportRawMaterialTaxesMutation();

  const debouncedSetSearch = useDebounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  useEffect(() => {
    refetch();
  }, [sortBy, sortOrder, refetch]);

  const handleOpenCreateModal = () => {
    setEditingTax(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tax: RawMaterialTax) => {
    setEditingTax(tax);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTax(null);
  };

  const handleDelete = async () => {
    if (!deletingTaxId) return;

    try {
      await deleteMutation.mutateAsync(deletingTaxId);
      toast.success("Imposto de matéria-prima excluído com sucesso");
      setDeletingTaxId(null);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(message || "Erro ao excluir imposto de matéria-prima");
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleExport = async (options: {
    limit: number;
    columns: string[];
    sortBy: string;
    sortOrder: "asc" | "desc";
  }) => {
    try {
      const blob = await exportMutation.mutateAsync({
        format: "csv",
        limit: options.limit,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        filters: { search },
      });

      const filename = `impostos-materia-prima-${new Date().toISOString().split("T")[0]}.csv`;
      triggerCsvDownload(blob, filename);
      toast.success("CSV exportado com sucesso");
      setIsExportModalOpen(false);
    } catch (error) {
      toast.error("Erro ao exportar CSV");
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Impostos de Matéria-Prima"
          onNewClick={handleOpenCreateModal}
          onExportClick={() => setIsExportModalOpen(true)}
          onSearchChange={handleSearchChange}
          searchValue={searchInput}
        />
        <LoadingSpinner size="lg" />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader
          title="Impostos de Matéria-Prima"
          onNewClick={handleOpenCreateModal}
          onExportClick={() => setIsExportModalOpen(true)}
          onSearchChange={handleSearchChange}
          searchValue={searchInput}
        />
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-red-600 font-semibold">Erro ao carregar impostos</p>
          <p className="text-sm text-gray-500 mt-2">
            Tente recarregar a página ou entre em contato com o suporte
          </p>
        </div>
      </>
    );
  }

  const hasTaxes = data?.data && data.data.length > 0;

  return (
    <>
      <PageHeader
        title="Impostos de Matéria-Prima"
        onNewClick={handleOpenCreateModal}
        onExportClick={() => setIsExportModalOpen(true)}
        onSearchChange={handleSearchChange}
        searchValue={searchInput}
      />

      {!hasTaxes && !search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">Nenhum imposto de matéria-prima cadastrado</p>
          <p className="text-sm text-gray-400 mt-2">
            Clique em "Novo Imposto" para começar
          </p>
        </div>
      ) : !hasTaxes && search ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">
            Nenhum resultado encontrado para "{search}"
          </p>
        </div>
      ) : hasTaxes ? (
        <>
          {isFetching && (
            <div className="mb-2 text-sm text-blue-600 text-right animate-pulse">
              🔄 Atualizando...
            </div>
          )}

          <RawMaterialTaxesTable
            taxes={data.data}
            onEdit={handleOpenEditModal}
            onDelete={(id) => setDeletingTaxId(id)}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />

          {data.meta && data.meta.totalPages > 1 && (
            <div className="mb-8">
              <Pagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : null}

      <RawMaterialTaxModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tax={editingTax}
      />

      <ConfirmModal
        isOpen={!!deletingTaxId}
        onClose={() => setDeletingTaxId(null)}
        onConfirm={handleDelete}
        title="Excluir Imposto de Matéria-Prima"
        message="Tem certeza que deseja excluir este imposto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExport}
        defaultColumns={EXPORT_COLUMNS}
      />
    </>
  );
}