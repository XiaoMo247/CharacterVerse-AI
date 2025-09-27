import { Card, Avatar, Button, Tag, Popconfirm } from 'antd'
import { DeleteOutlined, MessageOutlined, EditOutlined, StarOutlined, StarFilled } from '@ant-design/icons'
import './CharacterCard.css'

const { Meta } = Card

const CharacterCard = ({ 
  character,
  onDelete,
  onChat,
  onEdit,
  onToggleFavorite,
  showActions = true,
  className = '',
  ...props 
}) => {
  const actions = showActions ? [
    // TODO: 添加收藏按钮
    onToggleFavorite && (
      <Button 
        key="favorite"
        type="text" 
        icon={character.favorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
        onClick={() => onToggleFavorite?.(character.id)}
        size="middle"
      />
    ),
    // TODO: 添加编辑按钮
    onEdit && (
      <Button 
        key="edit"
        type="text" 
        icon={<EditOutlined />}
        onClick={() => onEdit?.(character)}
        size="middle"
      />
    ),
    // TODO: 添加聊天按钮
    onChat && (
      <Button 
        key="chat"
        type="text" 
        icon={<MessageOutlined />}
        onClick={() => onChat?.(character)}
        size="middle"
      >
      </Button>
    ),
    // TODO: 添加删除按钮
    onDelete && (
      <Popconfirm
        key="delete"
        title="确定要删除这个角色吗？"
        onConfirm={() => onDelete?.(character.id)}
        okText="确定"
        cancelText="取消"
      >
        <Button 
          type="text" 
          danger
          icon={<DeleteOutlined />}
          size="middle"
        />
      </Popconfirm>
    )
  ].filter(Boolean) : []

  return (
    <Card
      className={`character-card ${className}`}
      actions={actions}
      hoverable
      {...props}
    >
      <Meta
        avatar={
          <Avatar size={48} 
            style={{ fontSize: '1.5rem' }}
            src={character.avatar_url?.startsWith('http') ? character.avatar_url : null}
          >
            {character.avatar_url?.startsWith('http') ? '' : '🤖'}
          </Avatar>
        }
        title={character.name}
        description={
          <div className="character-meta">
            <div style={{ marginBottom: '8px' }}>
              {character.gender && (
                <Tag color="blue" className="gender-tag">
                  {character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : character.gender}
                </Tag>
              )}
              {character.age && (
                <Tag color="green" className="age-tag">
                  {character.age ? `${character.age}岁`: '未知'}
                </Tag>
              )}
              {character.tag && (
                <Tag color="purple" className="voice-tag">
                  {character.tag? character.tag : ''}
                </Tag>
              )}
            </div>
            <p className="character-description">{character.description}</p>
            {character.created_at && (
              <p className="created-date">
                创建于: {new Date(character.CreatedAt).toLocaleDateString('zh-CN')}
              </p>
            )}
          </div>
        }
      />
    </Card>
  )
}

export default CharacterCard