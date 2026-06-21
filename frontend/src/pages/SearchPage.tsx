import { PageHero } from '../components/PageHero'
import { SearchTabs } from '../components/SearchTabs'
import { useLang } from '../context/LanguageContext'

export function SearchPage() {
  const { t } = useLang()
  return (
    <>
      <PageHero title={t.search.heading} subtitle={t.search.subheading} />
      <SearchTabs />
    </>
  )
}
