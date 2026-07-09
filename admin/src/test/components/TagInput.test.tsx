import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TagInput from '../../components/ui/TagInput';

describe('TagInput', () => {
  it('renders existing tags', () => {
    render(<TagInput tags={['react', 'typescript']} onChange={vi.fn()} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('shows placeholder when no tags', () => {
    render(<TagInput tags={[]} onChange={vi.fn()} placeholder="Add skills..." />);
    expect(screen.getByPlaceholderText('Add skills...')).toBeInTheDocument();
  });

  it('adds tag on Enter key', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Add tag...');
    await user.type(input, 'newtag{Enter}');
    expect(handleChange).toHaveBeenCalledWith(['newtag']);
  });

  it('adds tag on comma key', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Add tag...');
    await user.type(input, 'another,');
    expect(handleChange).toHaveBeenCalledWith(['another']);
  });

  it('removes tag on X button click', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={['toremove']} onChange={handleChange} />);
    const removeBtn = screen.getByRole('button');
    await user.click(removeBtn);
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('does not add duplicate tags', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={['existing']} onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'existing{Enter}');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('trims whitespace from tags', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Add tag...');
    await user.type(input, '  spaced  {Enter}');
    expect(handleChange).toHaveBeenCalledWith(['spaced']);
  });

  it('adds tag on blur', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TagInput tags={[]} onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Add tag...');
    await user.type(input, 'blurtag');
    await user.click(document.body);
    expect(handleChange).toHaveBeenCalledWith(['blurtag']);
  });
});
