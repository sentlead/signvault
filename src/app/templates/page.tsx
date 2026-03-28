import { Copy, Sparkles } from 'lucide-react'

export const metadata = { title: 'Templates — SignVault' }

export default function TemplatesPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 flex flex-col items-center text-center gap-6">

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-sv-primary/10 dark:bg-sv-dark-primary/20
                      flex items-center justify-center">
        <Copy className="w-9 h-9 text-sv-primary dark:text-sv-dark-primary" />
      </div>

      {/* Heading */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                        bg-amber-100 dark:bg-amber-900/30
                        text-amber-600 dark:text-amber-400
                        text-xs font-semibold uppercase tracking-widest mb-3">
          <Sparkles className="w-3 h-3" />
          Coming Soon
        </div>
        <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">
          Document Templates
        </h1>
        <p className="mt-3 text-sv-secondary dark:text-sv-dark-secondary text-sm leading-relaxed">
          Save any document as a reusable template — pre-placed signature fields and all.
          Send the same contract to multiple signers without starting from scratch each time.
        </p>
      </div>

      {/* Feature list */}
      <ul className="w-full max-w-sm space-y-3 text-left">
        {[
          'Save documents with pre-placed fields as templates',
          'Send the same template to multiple signers',
          'Customise recipient names and emails per send',
          'Track all sends from a single template view',
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-sv-secondary dark:text-sv-dark-secondary">
            <span className="mt-0.5 w-4 h-4 rounded-full bg-sv-primary/10 dark:bg-sv-dark-primary/20
                             flex items-center justify-center flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-sv-primary dark:text-sv-dark-primary block" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
