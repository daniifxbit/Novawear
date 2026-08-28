import { Drip } from '../components/Drip'
import { RichText } from '../legal/RichText'
import { LEGAL_DOCS, findLegalDoc, type Block, type LegalDocId } from '../legal/content'
import { useShop } from '../shop'

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="legal__p">
          <RichText text={block.text} />
        </p>
      )
    case 'list':
      return (
        <ul className="legal__list">
          {block.items.map((item, i) => (
            <li key={i}>
              <RichText text={item} />
            </li>
          ))}
        </ul>
      )
    case 'note':
      return (
        <div className="legal__note">
          <RichText text={block.text} />
        </div>
      )
    case 'quote':
      return <pre className="legal__quote">{block.text}</pre>
    case 'table':
      return (
        <div className="legal__table-wrap">
          <table className="legal__table">
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th key={cell}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

export function LegalView({ doc: docId }: { doc: LegalDocId }) {
  const { navigate } = useShop()
  const doc = findLegalDoc(docId)

  return (
    <section className="legal">
      <div className="breadcrumb" style={{ marginBottom: 18 }}>
        <button className="breadcrumb__link" onClick={() => navigate({ name: 'home' })}>
          Catalogue
        </button>
        <span className="breadcrumb__sep">/</span>
        <span className="breadcrumb__current">{doc.navLabel}</span>
      </div>

      <span className="eyebrow">{doc.eyebrow}</span>
      <h1 className="legal__title">{doc.title}</h1>
      <Drip
        style={{ width: 'min(220px, 60vw)', margin: '18px 0 22px' }}
        runs={[
          { left: '20%', height: 15 },
          { left: '55%', height: 9 },
          { left: '74%', height: 22 },
        ]}
      />
      <p className="legal__intro">{doc.intro}</p>

      <nav className="legal__nav" aria-label="Documents légaux">
        {LEGAL_DOCS.map((entry) => (
          <button
            key={entry.id}
            className={`chip${entry.id === doc.id ? ' chip--active' : ''}`}
            onClick={() => navigate({ name: 'legal', doc: entry.id })}
          >
            {entry.navLabel}
          </button>
        ))}
      </nav>

      <article className="legal__body">
        {doc.sections.map((section) => (
          <section className="legal__section" key={section.title}>
            <h2 className="legal__section-title">{section.title}</h2>
            {section.blocks.map((block, i) => (
              <BlockView block={block} key={i} />
            ))}
          </section>
        ))}
      </article>
    </section>
  )
}
