import { LAYER_GROUPS, type LayerGroupId } from '../../../utils/layers'
import styles from './LayerToggle.module.scss'

interface LayerToggleProps {
  active: Set<LayerGroupId>
  onToggle: (group: LayerGroupId) => void
}

export default function LayerToggle({ active, onToggle }: LayerToggleProps) {
  return (
    <div className={styles.wrap} role="group" aria-label="Map layers">
      {LAYER_GROUPS.map((group) => {
        const isActive = active.has(group.id)
        return (
          <button
            key={group.id}
            type="button"
            className={isActive ? `${styles.pill} ${styles.on}` : styles.pill}
            onClick={() => onToggle(group.id)}
            aria-pressed={isActive}
          >
            <span className={styles.dot} style={{ background: group.color }} />
            <span>{group.label}</span>
          </button>
        )
      })}
    </div>
  )
}