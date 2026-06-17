import type { FacetState } from '../lib/facets';
import { facetCount } from '../lib/facets';
import {
  SUB_BRAND_ORDER, SUB_BRANDS, AGE_GROUPS, SUBJECTS,
  RECORD_TYPE_ORDER, RECORD_TYPES,
} from '../data/vocabularies';

interface FacetsProps {
  value: FacetState;
  onChange: (next: FacetState) => void;
  /** Hide the "Type" group (e.g. on the calendar, which is events-only). */
  showTypes?: boolean;
}

/** Multi-select checkbox group used for each facet. Toggling an option adds or
 *  removes its id from the relevant array in the facet state. */
function CheckGroup<T extends string>(props: {
  legend: string;
  options: { id: T; label: string }[];
  selected: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <fieldset className="facets__group">
      <legend className="facets__legend">{props.legend}</legend>
      <div className="facets__opts">
        {props.options.map(o => (
          <label key={o.id} className="facet-opt">
            <input
              type="checkbox"
              checked={props.selected.includes(o.id)}
              onChange={() => props.onToggle(o.id)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Facets({ value, onChange, showTypes = true }: FacetsProps) {
  // Generic toggle that flips membership of `id` within `value[key]`.
  function toggle<K extends 'audiences' | 'ageGroups' | 'subjects' | 'types'>(
    key: K, id: FacetState[K][number],
  ) {
    const arr = value[key] as string[];
    const next = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
    onChange({ ...value, [key]: next });
  }

  const active = facetCount(value);

  return (
    <form className="facets" aria-label="Filter results" onSubmit={e => e.preventDefault()}>
      <div className="cluster" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Filters</span>
        {active > 0 && (
          <button type="button" className="linkbtn" onClick={() => onChange({
            audiences: [], ageGroups: [], subjects: [], types: [],
            usefulForTeachers: false, text: value.text, // keep any text search
          })}>
            Clear filters
          </button>
        )}
      </div>

      <CheckGroup
        legend="Who it's for"
        options={SUB_BRAND_ORDER.map(id => ({ id, label: SUB_BRANDS[id].label }))}
        selected={value.audiences}
        onToggle={id => toggle('audiences', id)}
      />
      <CheckGroup
        legend="Age"
        options={AGE_GROUPS}
        selected={value.ageGroups}
        onToggle={id => toggle('ageGroups', id)}
      />
      <CheckGroup
        legend="Subject"
        options={SUBJECTS}
        selected={value.subjects}
        onToggle={id => toggle('subjects', id)}
      />
      {showTypes && (
        <CheckGroup
          legend="Type"
          options={RECORD_TYPE_ORDER.map(id => ({ id, label: RECORD_TYPES[id].label }))}
          selected={value.types}
          onToggle={id => toggle('types', id)}
        />
      )}

      <fieldset className="facets__group">
        <legend className="facets__legend">Teachers</legend>
        <label className="facet-opt">
          <input
            type="checkbox"
            checked={value.usefulForTeachers}
            onChange={() => onChange({ ...value, usefulForTeachers: !value.usefulForTeachers })}
          />
          <span>Only things useful for teachers</span>
        </label>
      </fieldset>
    </form>
  );
}
