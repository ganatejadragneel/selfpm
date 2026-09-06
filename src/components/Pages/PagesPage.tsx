// Pages — the three-column notebook surface (Mac-Notes style).
// Folders | pages-in-folder | editor. Backed by the local pagesStore for now;
// swap to the Supabase-backed kbStore after the migration with no UI change.

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSurfacePalette } from '../../hooks/useSurfacePalette';
import { usePagesStore, UNFILED } from './pagesStore';
import { FolderList } from './FolderList';
import { DocumentList } from './DocumentList';
import { DocumentEditor } from './DocumentEditor';
import { PagesExportButton } from './PagesExportButton';

export function PagesPage() {
  const {
    folders,
    documents,
    activeFolderId,
    activeDocId,
    saving,
    loading,
    initialized,
    init,
    setActiveFolder,
    setActiveDoc,
    createFolder,
    renameFolder,
    deleteFolder,
    createDocument,
    updateDocument,
    deleteDocument,
    reorderDocument,
  } = usePagesStore();

  const { hair: HAIR, surfaceCard: SURFACE, muted: MUTED } = useSurfacePalette();

  // ?doc=<id> deep-link: the CPO Reports tab opens a generated report here.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDoc = searchParams.get('doc');

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  useEffect(() => {
    if (!initialized || !requestedDoc) return;
    const doc = documents.find((d) => d.id === requestedDoc);
    // Select the document AND its folder, so the middle column shows it in
    // context rather than the doc appearing selected in a folder it isn't in.
    if (doc) {
      setActiveFolder(doc.folder_id ?? UNFILED);
      setActiveDoc(doc.id);
    }
    // Clear the param either way: a stale id must not keep re-firing this.
    searchParams.delete('doc');
    setSearchParams(searchParams, { replace: true });
  }, [initialized, requestedDoc, documents, setActiveFolder, setActiveDoc, searchParams, setSearchParams]);

  if (loading && !initialized) {
    return (
      <div
        style={{
          height: 'calc(100vh - 150px)',
          minHeight: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: SURFACE,
          borderRadius: 18,
          color: MUTED,
          fontSize: 14,
        }}
      >
        Loading your pages…
      </div>
    );
  }

  const isUnfiled = activeFolderId === UNFILED;
  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;
  const folderDocs = documents.filter((d) => d.folder_id === (isUnfiled ? null : activeFolderId));
  const activeDoc = documents.find((d) => d.id === activeDocId) ?? null;
  const hasUnfiled = documents.some((d) => d.folder_id === null);
  const folderName = isUnfiled ? 'Unfiled' : activeFolder?.name ?? 'Pages';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 270px 1fr',
        // minmax(0, 1fr) pins the single row to the container's height. Without it
        // the implicit `auto` row grows to fit its content, so each column's
        // `height: 100%` resolves against the overgrown row and the inner
        // `overflow-y: auto` never scrolls — a long folder just gets clipped.
        gridTemplateRows: 'minmax(0, 1fr)',
        height: 'calc(100vh - 150px)',
        minHeight: 520,
        background: SURFACE,
        borderRadius: 18,
        border: `1px solid ${HAIR}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      <div style={{ ...column, borderRight: `1px solid ${HAIR}` }}>
        <FolderList
          folders={folders}
          activeFolderId={activeFolderId}
          showUnfiled={hasUnfiled}
          onSelect={setActiveFolder}
          onCreate={createFolder}
          onRename={renameFolder}
          onDelete={deleteFolder}
        />
      </div>

      <div style={{ ...column, borderRight: `1px solid ${HAIR}` }}>
        <DocumentList
          folderName={folderName}
          documents={folderDocs}
          activeDocId={activeDocId}
          headerAction={
            <PagesExportButton
              documents={documents}
              folders={folders}
              activeFolderId={activeFolderId}
              folderDocs={folderDocs}
              folderName={folderName}
            />
          }
          onSelect={setActiveDoc}
          onCreate={() => activeFolderId && createDocument(activeFolderId)}
          onDelete={deleteDocument}
          onReorder={reorderDocument}
        />
      </div>

      <div style={column}>
        <DocumentEditor
          doc={activeDoc}
          saving={saving}
          onChange={(patch) => activeDocId && updateDocument(activeDocId, patch)}
        />
      </div>
    </div>
  );
}

// Every column is a grid item wrapping a `height: 100%` scroll container, so it
// must be free to shrink below its content height in both axes.
//
// Deliberately NOT `overflow: hidden`. The min-*: 0 above is what lets the inner
// scroll containers work; clipping here adds nothing (the child is height:100%
// with its own scroller) and it silently cut off the FeatureTip popover at the
// column edge.
const column: React.CSSProperties = { minWidth: 0, minHeight: 0 };

export default PagesPage;
