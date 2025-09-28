import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Button, Tag, Space, Spin, Empty } from 'antd'
import { 
  PlusOutlined, 
  MinusOutlined, 
  ReloadOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons'
import { PageContainer, CharacterCard } from '../../components'
import useStore from '../../store/useStore'
import { SearchBar } from './components'
import useHomeStore from './store/useHomeStore'
import { searchList, allList } from './server/homeService'
import useChatStore from '../Chat/store/useChatStore'

const Home = () => {
  const navigate = useNavigate()
  const { count, increment, decrement, reset, isDark, toggleTheme } = useStore()
  const { setPendingCharacter } = useChatStore()
  const { 
    searchResults, 
    isSearching, 
    setSearching, 
    setSearchResults, 
    clearSearch,
    // 角色列表相关状态
    characterList,
    isLoading,
    hasMore,
    currentPage,
    pageSize,
    total,
    setLoading,
    setCharacterList,
    setListData,
    resetCharacterList,
    loadNextPage
  } = useHomeStore()

  const loadingRef = useRef(null)

  // 获取角色列表
  const fetchCharacterList = useCallback(async (page = 1, isAppend = false) => {
    if (isLoading) return
    
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize
      }
      const response = await allList(params)
      
      if (response && response.data) {
        const { list, total, pages, has_more, page: currentPageNum } = response.data
        
        setCharacterList(list || [], isAppend)
        setListData({
          total,
          pages,
          has_more,
          page: currentPageNum
        })
      }
    } catch (error) {
      console.error('获取角色列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [isLoading, pageSize, setLoading, setCharacterList, setListData])

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      const nextPage = currentPage + 1
      loadNextPage()
      fetchCharacterList(nextPage, true)
    }
  }, [hasMore, isLoading, currentPage, loadNextPage, fetchCharacterList])

  // 懒加载监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observer.observe(loadingRef.current)
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current)
      }
    }
  }, [hasMore, isLoading, loadMore])

  // 初始化加载数据
  useEffect(() => {
    resetCharacterList()
    fetchCharacterList(1)
  }, [])

  // 处理聊天按钮点击
  const handleChat = useCallback((character) => {
    // 将角色信息存储到 ChatStore 中
    setPendingCharacter(character)
    // 跳转到聊天页面
    navigate('/chat')
  }, [setPendingCharacter, navigate])

  // 搜索处理函数
  const handleSearch = async (value) => {
    if (!value.trim()) {
      clearSearch()
      return
    }

    // 跳转到搜索结果页面
    navigate(`/search?keyword=${encodeURIComponent(value)}`)
  }

  return (
    <>
      {/* 顶部搜索栏 */}

      <PageContainer
        title="AI模拟宇宙"
        description="欢迎来到AI模拟宇宙- 体验与不同AI角色聊天"
        centered={true}
      >
      <SearchBar 
        onSearch={handleSearch}
        loading={isSearching}
        placeholder="输入关键词搜索角色、对话、功能..."
      />

      {/* 角色展示区域 */}
      <div style={{ marginTop: '40px' }}>
        
        {/* 角色列表 */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1890ff', fontSize: '18px' }}>
             角色列表 {total > 0 && <span style={{ fontSize: '14px', color: '#666' }}>({total}个角色)</span>}
          </h3>
          
          {characterList.length > 0 ? (
            <>
              <Row gutter={[16, 16]}>
                {characterList.map(character => (
                  <Col key={character.id} xs={24} sm={12} md={8} lg={6}>
                    <CharacterCard 
                      character={character}
                      showActions={true}
                      onChat={handleChat}
                    />
                  </Col>
                ))}
              </Row>
              
              {/* 懒加载触发器 */}
              <div 
                ref={loadingRef}
                style={{ 
                  textAlign: 'center', 
                  marginTop: '20px',
                  padding: '20px'
                }}
              >
                {isLoading && (
                  <Spin size="large" tip="加载中..." />
                )}
                {!hasMore && characterList.length > 0 && (
                  <div style={{ color: '#999' }}>已加载全部角色</div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              {isLoading ? (
                <Spin size="large" tip="加载中..." />
              ) : (
                <Empty 
                  description="暂无角色数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          )}
        </div>
      </div>

      </PageContainer>
    </>
  )
}

export default Home