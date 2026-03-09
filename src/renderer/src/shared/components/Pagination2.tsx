import { ReactNode } from "react";
import { SetURLSearchParams } from "react-router-dom";
import Button from "./ui/Button";
import { ChevronsLeft, ChevronsRight } from "react-feather";
import { NumericFormat } from "react-number-format";
import Input from "@renderer/shared/components/ui/Input";

type Props = {
  pageSize: number;
  paginateSize: number;
  total: number;
  currentPage: number;
  searchParams: URLSearchParams;
  onSearchParams: SetURLSearchParams;
  onPageSize: (v: number) => void;
};

export default function Pagination2({
  pageSize,
  paginateSize,
  total,
  currentPage = 0,
  searchParams,
  onSearchParams,
  onPageSize,
}: Props): ReactNode {
  const median = Math.ceil(paginateSize / 2) - 1;

  const totalPage = Math.ceil(total / pageSize);

  // console.log({ totalPage, median, paginateSize, currentPage });

  return (
    <div className="flex  justify-between">
      <div className="flex items-center gap-x-2">
        <p>Showing 1 to</p>
        <div className="w-[100px]">
          <NumericFormat
            defaultValue={pageSize}
            customInput={Input}
            onValueChange={(values) => {
              const { floatValue } = values;

              if (floatValue) {
                onSearchParams({
                  ...searchParams,
                  currentPage: "0",
                });
                onPageSize(floatValue);
              }
            }}
          />
        </div>
        <p>of {total} results</p>
      </div>

      <nav>
        <ul className="flex gap-x-1">
          {currentPage > 0 && (
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                onSearchParams({
                  ...searchParams,
                  currentPage: String(0),
                })
              }
            >
              <ChevronsLeft size={14} />
            </Button>
          )}

          {new Array(paginateSize).fill(0).map((_, idx) => {
            const offset = idx - median + currentPage;
            if (idx >= totalPage || offset >= totalPage) return;

            if (currentPage > median) {
              if (idx === median) {
                return (
                  <Button key={idx} size="xs" disabled>
                    {currentPage + 1}
                  </Button>
                );
              }

              return (
                <Button
                  key={idx}
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    onSearchParams({
                      ...searchParams,
                      currentPage: String(offset),
                    })
                  }
                >
                  {offset + 1}
                </Button>
              );
            } else {
              if (idx === currentPage) {
                return (
                  <Button key={idx} size="xs" disabled>
                    {currentPage + 1}
                  </Button>
                );
              }
              return (
                <Button
                  key={idx}
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    onSearchParams({
                      ...searchParams,
                      currentPage: String(idx),
                    })
                  }
                >
                  {idx + 1}
                </Button>
              );
            }
          })}

          {currentPage + 1 < totalPage && (
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                onSearchParams({
                  ...searchParams,
                  currentPage: String(totalPage - 1),
                })
              }
            >
              <ChevronsRight size={14} />
            </Button>
          )}
        </ul>
      </nav>
    </div>
  );
}
