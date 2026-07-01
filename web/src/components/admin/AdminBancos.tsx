"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { BancoRow } from "@/lib/queries/bancos";
import { materiaNombre } from "@/lib/queries/bancos";

type Props = { bancos: BancoRow[] };

export function AdminBancos({ bancos: initial }: Props) {
  const router = useRouter();
  const [bancos, setBancos] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [materiaFiltro, setMateriaFiltro] = useState("todas");

  useEffect(() => {
    setBancos(initial);
  }, [initial]);

  const materias = useMemo(() => {
    const nombres = new Set(bancos.map((b) => materiaNombre(b.materias)));
    return ["todas", ...Array.from(nombres).sort((a, b) => a.localeCompare(b))];
  }, [bancos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bancos.filter((b) => {
      const nombreB = b.nombre.toLowerCase();
      const materiaB = materiaNombre(b.materias).toLowerCase();
      const pasaTexto = !q || nombreB.includes(q) || materiaB.includes(q);
      const pasaMateria =
        materiaFiltro === "todas" || materiaB === materiaFiltro.toLowerCase();
      return pasaTexto && pasaMateria;
    });
  }, [bancos, search, materiaFiltro]);

  async function eliminar(id: string, nombre: string) {
    if (!confirm(`¿Eliminar el banco «${nombre}» y todas sus preguntas?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/bancos/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      alert((await res.json()).error || "No se pudo eliminar");
      return;
    }
    setBancos((list) => list.filter((b) => b.id !== id));
    router.refresh();
  }

  return (
    <div className="card">
      <h2>Bancos</h2>
      <p className="muted small">Temario jurídicas JEX — Junta de Extremadura.</p>

      <div className="admin-bancos-filtros">
        <label className="admin-filter" style={{ flex: 1 }}>
          Buscar banco
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, materia…"
          />
        </label>

        <label className="admin-filter" style={{ minWidth: "200px" }}>
          Materia
          <select
            value={materiaFiltro}
            onChange={(e) => setMateriaFiltro(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              marginTop: "0.35rem",
              padding: "0.65rem 0.75rem",
              font: "inherit",
              fontSize: "0.95rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {materias.map((m) => (
              <option key={m} value={m}>
                {m === "todas" ? "Todas" : m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="muted small" style={{ marginBottom: "0.75rem" }}>
        {filtered.length} banco{filtered.length !== 1 ? "s" : ""}
        {materiaFiltro !== "todas" ? ` en ${materiaFiltro}` : " en total"}
      </p>

      {filtered.length === 0 ? (
        <p className="muted">
          {bancos.length === 0 ? "Sin bancos todavía." : "Ningún banco coincide."}
        </p>
      ) : (
        <ul className="admin-banco-list">
          {filtered.map((b) => (
            <li key={b.id}>
              <div className="admin-banco-info">
                <span className="materia-tag">{materiaNombre(b.materias)}</span>
                <Link href={`/admin/bancos/${b.id}`}>
                  <strong>{b.nombre}</strong>
                </Link>
                <span className={`tipo-pill ${b.tipo}`}>{b.tipo}</span>
                {b.numPreguntas !== undefined && (
                  <span className="muted small">{b.numPreguntas} preg.</span>
                )}
              </div>
              <div className="admin-banco-actions">
                <Link href={`/admin/bancos/${b.id}`} className="btn-primary btn-sm">
                  Editar
                </Link>
                <Link href={`/test/${b.id}`} className="btn-secondary btn-sm">
                  Probar
                </Link>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  disabled={deleting === b.id}
                  onClick={() => void eliminar(b.id, b.nombre)}
                >
                  {deleting === b.id ? "…" : "Eliminar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
