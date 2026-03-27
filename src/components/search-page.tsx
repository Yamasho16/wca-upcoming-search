"use client";

import { FormEvent, useEffect, useState } from "react";

import { WCA_EVENT_NAME_MAP, WCA_EVENT_OPTIONS } from "@/constants/wca-events";
import { formatDateRange } from "@/lib/date";
import type { CompetitionSearchResult, CompetitionsApiResponse } from "@/types/competition";

type SearchFormState = {
  location: string;
  eventId: string;
  roundsGte: string;
  startFrom: string;
  startTo: string;
};

const initialState: SearchFormState = {
  location: "",
  eventId: "",
  roundsGte: "",
  startFrom: "",
  startTo: "",
};

function buildQueryString(state: SearchFormState): string {
  const searchParams = new URLSearchParams();

  if (state.location) {
    searchParams.set("location", state.location);
  }

  if (state.eventId) {
    searchParams.set("eventId", state.eventId);
  }

  if (state.roundsGte) {
    searchParams.set("roundsGte", state.roundsGte);
  }

  if (state.startFrom) {
    searchParams.set("startFrom", state.startFrom);
  }

  if (state.startTo) {
    searchParams.set("startTo", state.startTo);
  }

  return searchParams.toString();
}

function formatRoundCounts(eventRoundCounts: Record<string, number>): string {
  return Object.entries(eventRoundCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([eventId, count]) =>
        `${WCA_EVENT_NAME_MAP[eventId as keyof typeof WCA_EVENT_NAME_MAP] || eventId}: ${count}`,
    )
    .join(" / ");
}

export function SearchPage() {
  const [form, setForm] = useState<SearchFormState>(initialState);
  const [items, setItems] = useState<CompetitionSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(state: SearchFormState) {
    setLoading(true);
    setError("");

    try {
      const query = buildQueryString(state);
      const response = await fetch(query ? `/api/competitions?${query}` : "/api/competitions");
      const data = (await response.json()) as CompetitionsApiResponse | { error: string };

      if (!response.ok || !("items" in data)) {
        throw new Error("error" in data ? data.error : "Failed to fetch competitions.");
      }

      setItems(data.items);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void search(initialState);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void search(form);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-[0_18px_60px_rgba(17,70,166,0.08)]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            WCA Upcoming Search
          </p>
          <h1 className="mt-2 text-3xl font-semibold">今後の WCA 大会をラウンド数で検索</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            WCA の今後開催大会を Firestore に同期し、種目ごとのラウンド数を WCIF の
            rounds 構造から判定して検索します。
          </p>
        </div>

        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium">
            国 / 地域 / 都市
            <input
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent)]"
              placeholder="Japan, Asia, Tokyo"
              value={form.location}
              onChange={(event) =>
                setForm((current) => ({ ...current, location: event.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            種目
            <select
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent)]"
              value={form.eventId}
              onChange={(event) =>
                setForm((current) => ({ ...current, eventId: event.target.value }))
              }
            >
              <option value="">指定なし</option>
              {WCA_EVENT_OPTIONS.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            最低ラウンド数
            <input
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent)]"
              type="number"
              min={1}
              placeholder="3"
              value={form.roundsGte}
              onChange={(event) =>
                setForm((current) => ({ ...current, roundsGte: event.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            開催日 From
            <input
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent)]"
              type="date"
              value={form.startFrom}
              onChange={(event) =>
                setForm((current) => ({ ...current, startFrom: event.target.value }))
              }
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium">
            開催日 To
            <input
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 outline-none transition focus:border-[var(--accent)]"
              type="date"
              value={form.startTo}
              onChange={(event) =>
                setForm((current) => ({ ...current, startTo: event.target.value }))
              }
            />
          </label>

          <div className="flex gap-3 md:col-span-2 xl:col-span-5">
            <button
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "検索中..." : "検索"}
            </button>
            <button
              className="rounded-xl border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold"
              type="button"
              onClick={() => {
                setForm(initialState);
                void search(initialState);
              }}
            >
              リセット
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-[0_12px_40px_rgba(19,32,51,0.06)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">検索結果</h2>
            <p className="text-sm text-[var(--muted)]">
              {loading ? "読み込み中" : `${items.length} 件の大会`}
            </p>
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {!error && items.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
            条件に一致する大会はありません。
          </div>
        ) : null}

        <div className="grid gap-4">
          {items.map((item) => (
            <article
              key={item.competitionId}
              className="rounded-2xl border border-[var(--line)] bg-white p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-sm text-[var(--muted)]">
                    {formatDateRange(item.startDate, item.endDate)}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.continent ? `${item.continent} / ` : ""}
                    {item.country}
                    {item.city ? ` / ${item.city}` : ""}
                    {item.venue ? ` / ${item.venue}` : ""}
                  </p>
                </div>

                <a
                  className="inline-flex w-fit rounded-xl border border-[var(--line)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)]"
                  href={item.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  WCA ページ
                </a>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                {formatRoundCounts(item.eventRoundCounts)}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
