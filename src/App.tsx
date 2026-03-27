import { useStackStore } from './store/stackStore'

function App() {
  const { items, settings, isLoading } = useStackStore()

  return (
    <div className="w-80 h-96 bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">DropIt</h1>
        <p className="text-xs text-gray-500">基于栈的任务管理</p>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="text-center text-gray-500">加载中...</div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              栈中项: {items.length}
            </div>
            <div className="text-xs text-gray-400">
              最大深度: {settings.maxDepth}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
