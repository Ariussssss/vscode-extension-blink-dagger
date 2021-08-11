import { QuickPickItem, QuickPick } from 'vscode'
import axios from 'axios'
import debounce from 'lodash.debounce'
import { quickPick, log, getToken, fetchIfNotExit } from './base'

const getList = (
  q: string
): Promise<Array<{ label: string; description: string }>> => {
  const token = getToken()
  return axios
    .get('https://api.github.com/search/repositories', {
      params: {
        q,
        per_page: 15,
      },
      headers: token
        ? {
            Authorization: `token ${token}`,
          }
        : {},
    })
    .then(({ data: { items } }: any) =>
      items.map((e: { full_name: string; description?: string }) => ({
        label: e['full_name'],
        description: e?.['description'] ?? '',
      }))
    )
    .catch((e) => {
      log('Fetch Error:', e)
    })
}

export const fetch = async () => {
  const cacheMap: Record<
    string,
    Array<{ label: string; description: string }>
  > = {}
  const onChange = debounce(
    async (value: string = '', input: QuickPick<QuickPickItem>) => {
      if (value in cacheMap) {
        input.items = cacheMap[value]
        return
      }
      const items = await getList(value)
      cacheMap[value] = items
      input.items = items
    },
    500
  )
  try {
    quickPick({
      title: 'Search from Github',
      initalItems: [],
      onChange,
      onDone: fetchIfNotExit,
    })
  } catch (err) {
    log('err', err.toString())
  }
}
