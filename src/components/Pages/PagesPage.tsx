// Pages — the three-column notebook surface (Mac-Notes style).
// Folders | pages-in-folder | editor. Backed by the local pagesStore for now;
// swap to the Supabase-backed kbStore after the migration with no UI change.

import { useEffect } from 'react';
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

  useEffect(() => {
    if (!initialized) init();
  }, [initialized, init]);

  if (loading && !initialized) {
    return (
      <div
        style={{
          height: 'calc(100vh - 150px)',
          minHeight: 520,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          borderRadius: 18,
          color: '#9ca3af',
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
        background: '#ffffff',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      <div style={{ ...column, borderRight: '1px solid #ececef', background: '#fbfbfc' }}>
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

      <div style={{ ...column, borderRight: '1px solid #ececef' }}>
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
const column: React.CSSProperties = { minWidth: 0, minHeight: 0, overflow: 'hidden' };

export default PagesPage;
