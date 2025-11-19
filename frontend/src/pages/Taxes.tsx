// src/pages/Taxes.tsx

import { useState } from "react";
import { Heading } from "@/components/common/Heading";
import { FreightTaxesSection } from "@/components/features/taxes/FreightTaxesSection";
import { RawMaterialTaxesSection } from "@/components/features/taxes/RawMaterialTaxesSection";

export default function Taxes() {
  const [activeTab, setActiveTab] = useState<"freight" | "rawMaterial">("freight");

  return (
    <div>
      <Heading as="h1" variant="title" className="mb-6">
        Impostos
      </Heading>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("freight")}
            className={`
              py-4 px-1 cursor-pointer border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "freight"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Impostos de Frete
          </button>
          <button
            onClick={() => setActiveTab("rawMaterial")}
            className={`
              py-4 px-1 cursor-pointer border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === "rawMaterial"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Impostos de Matéria-Prima
          </button>
        </nav>
      </div>

      {/* Conteúdo */}
      {activeTab === "freight" ? (
        <FreightTaxesSection />
      ) : (
        <RawMaterialTaxesSection />
      )}
    </div>
  );
}