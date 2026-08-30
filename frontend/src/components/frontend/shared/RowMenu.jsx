import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'

// items: [{ label, icon, danger?, onClick }]
//
// The dropdown is rendered into document.body via a portal instead of
// staying nested inside the row. Table rows in this app get a CSS
// `transform` (hover polish / entrance animation), and any transform on an
// ancestor creates its own stacking context - that was trapping this
// dropdown's z-index inside that row, so rows painted later (below it)
// covered the menu and swallowed clicks even though it was visible.
// Rendering into body sidesteps that entirely: position is computed from
// the trigger button's actual screen position instead of relying on CSS
// `position: absolute` inside a potentially-transformed ancestor.
function RowMenu({ items }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setCoords({ top: rect.bottom + 6, left: rect.right })
  }, [])

  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return undefined
    function handleClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  return (
    <div className="row-menu-wrap">
      <button
        type="button"
        className="row-menu-trigger"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="More actions"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>
      {open && createPortal(
        <div
          className="row-menu-dropdown row-menu-dropdown-portal"
          ref={dropdownRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, transform: 'translateX(-100%)' }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`row-menu-item ${item.danger ? 'row-menu-item-danger' : ''}`}
              onClick={() => { setOpen(false); item.onClick() }}
            >
              <FontAwesomeIcon icon={item.icon} /> {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

export default RowMenu
