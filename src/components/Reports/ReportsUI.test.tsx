/**
 * @vitest-environment jsdom
 *
 * Component behaviour for the CPO Reports tab. Asserts what the seeker can
 * actually do — not that pixels moved.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { GeneratePanel } from './GeneratePanel';
import { ReportsGrid } from './ReportsGrid';
import type { ReportGridRow } from './reportsLogic';

afterEach(cleanup);

const rows: ReportGridRow[] = [
  { id: '1', name: 'CPO Report — Aug 17', generated: '2026-08-21', period: '2026-08-17', notes: 'strong week', commitmentCount: 2, imported: false },
  { id: '2', name: 'Archive Report — Jun 18', generated: '2026-06-18', period: '2026-06-18', notes: '', commitmentCount: 0, imported: true },
];

describe('GeneratePanel', () => {
  it('generates with the default 7-day period', () => {
    const onGenerate = vi.fn();
    render(<GeneratePanel generating={false} onGenerate={onGenerate} />);
    expect((screen.getByLabelText(/period length/i) as HTMLInputElement).value).toBe('7');
    fireEvent.click(screen.getByRole('button', { name: /generate report/i }));
    expect(onGenerate).toHaveBeenCalledWith(7);
  });

  it('generates with an edited period', () => {
    const onGenerate = vi.fn();
    render(<GeneratePanel generating={false} onGenerate={onGenerate} />);
    fireEvent.change(screen.getByLabelText(/period length/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /generate report/i }));
    expect(onGenerate).toHaveBeenCalledWith(30);
  });

  it('submits on Enter', () => {
    const onGenerate = vi.fn();
    render(<GeneratePanel generating={false} onGenerate={onGenerate} />);
    fireEvent.keyDown(screen.getByLabelText(/period length/i), { key: 'Enter' });
    expect(onGenerate).toHaveBeenCalledWith(7);
  });

  it('blocks an invalid period and fires no request (brief §B4)', () => {
    const onGenerate = vi.fn();
    render(<GeneratePanel generating={false} onGenerate={onGenerate} />);
    const input = screen.getByLabelText(/period length/i);
    for (const bad of ['0', '-3', 'abc', '']) {
      fireEvent.change(input, { target: { value: bad } });
      fireEvent.click(screen.getByRole('button', { name: /generate report/i }));
    }
    expect(onGenerate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows an inline message explaining the clamp', () => {
    render(<GeneratePanel generating={false} onGenerate={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/period length/i), { target: { value: '99999' } });
    fireEvent.blur(screen.getByLabelText(/period length/i));
    expect(screen.getByRole('alert').textContent).toMatch(/365/);
  });

  it('disables the control while generating so a double-click cannot double-charge', () => {
    const onGenerate = vi.fn();
    render(<GeneratePanel generating={true} onGenerate={onGenerate} />);
    const btn = screen.getByRole('button', { name: /generate report/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(btn);
    expect(onGenerate).not.toHaveBeenCalled();
    expect(screen.getByText(/about a minute/i)).toBeTruthy();
  });
});

describe('ReportsGrid', () => {
  it('renders the four columns from the brief', () => {
    render(<ReportsGrid rows={rows} loading={false} onOpen={vi.fn()} onNotesChange={vi.fn()} />);
    for (const h of ['Name', 'Date Generated', 'Period', 'Notes']) {
      expect(screen.getByText(h)).toBeTruthy();
    }
  });

  it('shows human-formatted dates, not raw ISO', () => {
    render(<ReportsGrid rows={rows} loading={false} onOpen={vi.fn()} onNotesChange={vi.fn()} />);
    expect(screen.getByText('Aug 17, 2026')).toBeTruthy();
    expect(screen.queryByText('2026-08-17')).toBeNull();
  });

  it('marks imported reports and shows the commitment count', () => {
    render(<ReportsGrid rows={rows} loading={false} onOpen={vi.fn()} onNotesChange={vi.fn()} />);
    expect(screen.getByText('imported')).toBeTruthy();
    expect(screen.getByText('2c')).toBeTruthy();
  });

  it('opens a report when its row is clicked', () => {
    const onOpen = vi.fn();
    render(<ReportsGrid rows={rows} loading={false} onOpen={onOpen} onNotesChange={vi.fn()} />);
    fireEvent.click(screen.getByText('CPO Report — Aug 17'));
    expect(onOpen).toHaveBeenCalledWith('1');
  });

  it('edits a note inline without opening the report', () => {
    const onOpen = vi.fn();
    const onNotesChange = vi.fn();
    render(<ReportsGrid rows={rows} loading={false} onOpen={onOpen} onNotesChange={onNotesChange} />);

    fireEvent.click(screen.getByText('strong week'));
    const input = screen.getByLabelText(/note for CPO Report/i);
    fireEvent.change(input, { target: { value: 'best week yet' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNotesChange).toHaveBeenCalledWith('1', 'best week yet');
    expect(onOpen).not.toHaveBeenCalled(); // clicking the cell must not navigate
  });

  it('abandons a note edit on Escape', () => {
    const onNotesChange = vi.fn();
    render(<ReportsGrid rows={rows} loading={false} onOpen={vi.fn()} onNotesChange={onNotesChange} />);
    fireEvent.click(screen.getByText('strong week'));
    const input = screen.getByLabelText(/note for CPO Report/i);
    fireEvent.change(input, { target: { value: 'discard me' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onNotesChange).not.toHaveBeenCalled();
  });

  it('prompts to add a note when one is empty', () => {
    render(<ReportsGrid rows={rows} loading={false} onOpen={vi.fn()} onNotesChange={vi.fn()} />);
    expect(screen.getByText('Add a note…')).toBeTruthy();
  });

  it('shows a first-run empty state rather than a bare table', () => {
    render(<ReportsGrid rows={[]} loading={false} onOpen={vi.fn()} onNotesChange={vi.fn()} />);
    expect(screen.getByText(/No reports yet/i)).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows a loading state', () => {
    render(<ReportsGrid rows={[]} loading={true} onOpen={vi.fn()} onNotesChange={vi.fn()} />);
    expect(screen.getByText(/Loading your reports/i)).toBeTruthy();
  });

  it('renders one row per report', () => {
    render(<ReportsGrid rows={rows} loading={false} onOpen={vi.fn()} onNotesChange={vi.fn()} />);
    const body = screen.getByRole('table').querySelector('tbody')!;
    expect(within(body).getAllByRole('row')).toHaveLength(2);
  });
});
