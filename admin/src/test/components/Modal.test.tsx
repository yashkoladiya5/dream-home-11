import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Modal from '../../components/ui/Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test"><p>Content</p></Modal>);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows content when open', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Test Modal"><p>Modal Content</p></Modal>);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('supports open prop as alternative to isOpen', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Open Prop"><p>Content</p></Modal>);
    expect(screen.getByText('Open Prop')).toBeInTheDocument();
  });

  it('calls onClose when clicking close button', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal isOpen={true} onClose={handleClose} title="Closeable"><p>Content</p></Modal>);
    const closeBtn = screen.getByRole('button', { name: '' });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal isOpen={true} onClose={handleClose} title="Escape Test"><p>Content</p></Modal>);
    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders title correctly', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="My Custom Title"><p>Content</p></Modal>);
    expect(screen.getByText('My Custom Title')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="With Actions" actions={<button>Action</button>}>
        <p>Content</p>
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('does not render actions section when not provided', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="No Actions"><p>Content</p></Modal>);
    const actionBtn = screen.queryByRole('button', { name: 'Action' });
    expect(actionBtn).not.toBeInTheDocument();
  });

  it('closes when clicking backdrop', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal isOpen={true} onClose={handleClose} title="Backdrop"><p>Content</p></Modal>);
    const backdrop = document.querySelector('.fixed.inset-0.transition-opacity');
    if (backdrop) await user.click(backdrop);
    expect(handleClose).toHaveBeenCalled();
  });
});
