import type { RecordQuery, SubBrand, AgeGroupId, SubjectId, RecordType } from '../data/types';

/* The faceted directory keeps its state in the URL so a filtered view is
   shareable and bookmarkable (e.g. "all FunLab activities for primary").
   This mirrors how FacetWP / a WP archive encodes facets as query args, so
   the same links survive the move to WordPress — see WORDPRESS_MAPPING.md.

   Multi-selects are stored as comma-separated lists for short, readable URLs:
     /find?aud=funlab,futurelab&age=primary&type=event&teachers=1&q=volcano   */

export interface FacetState {
  audiences: SubBrand[];
  ageGroups: AgeGroupId[];
  subjects: SubjectId[];
  types: RecordType[];
  usefulForTeachers: boolean;
  text: string;
}

export const EMPTY_FACETS: FacetState = {
  audiences: [], ageGroups: [], subjects: [], types: [], usefulForTeachers: false, text: '',
};

const list = (v: string | null): string[] => (v ? v.split(',').filter(Boolean) : []);

export function facetsFromParams(p: URLSearchParams): FacetState {
  return {
    audiences: list(p.get('aud')) as SubBrand[],
    ageGroups: list(p.get('age')) as AgeGroupId[],
    subjects: list(p.get('subject')) as SubjectId[],
    types: list(p.get('type')) as RecordType[],
    usefulForTeachers: p.get('teachers') === '1',
    text: p.get('q') ?? '',
  };
}

export function facetsToParams(f: FacetState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.audiences.length) p.set('aud', f.audiences.join(','));
  if (f.ageGroups.length) p.set('age', f.ageGroups.join(','));
  if (f.subjects.length) p.set('subject', f.subjects.join(','));
  if (f.types.length) p.set('type', f.types.join(','));
  if (f.usefulForTeachers) p.set('teachers', '1');
  if (f.text.trim()) p.set('q', f.text.trim());
  return p;
}

/** Turn the UI facet state into the data layer's query contract. */
export function facetsToQuery(f: FacetState): RecordQuery {
  return {
    publicOnly: true,
    audiences: f.audiences.length ? f.audiences : undefined,
    ageGroups: f.ageGroups.length ? f.ageGroups : undefined,
    subjects: f.subjects.length ? f.subjects : undefined,
    types: f.types.length ? f.types : undefined,
    usefulForTeachers: f.usefulForTeachers || undefined,
    text: f.text.trim() || undefined,
  };
}

export const facetCount = (f: FacetState): number =>
  f.audiences.length + f.ageGroups.length + f.subjects.length +
  f.types.length + (f.usefulForTeachers ? 1 : 0) + (f.text.trim() ? 1 : 0);

/** Build a link into the directory pre-filtered to a single tag, e.g.
 *  findLink({ audiences: ['funlab'] }) → "/find?aud=funlab". Used by the
 *  clickable tag chips across cards and record pages. */
export function findLink(patch: Partial<FacetState>): string {
  const qs = facetsToParams({ ...EMPTY_FACETS, ...patch }).toString();
  return qs ? `/find?${qs}` : '/find';
}
