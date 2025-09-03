import React from 'react'
import { clsx } from 'clsx'

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  className?: string
  children: React.ReactNode
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={clsx('w-full caption-bottom text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
  children: React.ReactNode
}

export function TableHeader({ className, children, ...props }: TableHeaderProps) {
  return (
    <thead
      className={clsx('border-b bg-gray-50/50', className)}
      {...props}
    >
      {children}
    </thead>
  )
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
  children: React.ReactNode
}

export function TableBody({ className, children, ...props }: TableBodyProps) {
  return (
    <tbody
      className={clsx('divide-y divide-gray-200', className)}
      {...props}
    >
      {children}
    </tbody>
  )
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  className?: string
  children: React.ReactNode
}

export function TableRow({ className, children, ...props }: TableRowProps) {
  return (
    <tr
      className={clsx('border-b transition-colors hover:bg-gray-50/50', className)}
      {...props}
    >
      {children}
    </tr>
  )
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  className?: string
  children: React.ReactNode
}

export function TableHead({ className, children, ...props }: TableHeadProps) {
  return (
    <th
      className={clsx(
        'h-12 px-4 text-left align-middle font-medium text-gray-500',
        'first:pl-6 last:pr-6',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  className?: string
  children?: React.ReactNode
}

export function TableCell({ className, children, ...props }: TableCellProps) {
  return (
    <td
      className={clsx(
        'p-4 align-middle text-gray-900',
        'first:pl-6 last:pr-6',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}
