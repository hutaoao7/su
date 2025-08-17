<template>
  <view class="page">
    <view class="card" style="margin-bottom:16rpx">
      <text class="text-muted">✅ 社区页渲染成功（Safe UI）</text>
    </view>
    <view class="row">
      <button v-if="typeof loadPosts==='function'" class="btn-primary" @click="loadPosts">刷新帖子</button>
      <button v-if="typeof createPost==='function'" class="btn-primary" @click="createPost">发布内容</button>
    </view>
    <view v-if="posts && posts.length" class="card" style="margin-top:12rpx">
      <text class="text-muted">帖子列表（{{posts.length}}）</text>
      <view v-for="(it,idx) in posts.slice(0,3)" :key="idx" style="margin:6px 0">
        <text>{{ it.content || JSON.stringify(it) }}</text>
      </view>
    </view>
    <view v-if="(!posts || !posts.length)" class="empty">暂无数据，点击上方按钮试试</view>
  </view>
</template>

<script>
import NavBar from '@/components/common/NavBar.vue';

export default {
  components: {
    NavBar
  },
  data() {
    return {
      statusBarHeight: 20,
      searchKeyword: '',
      activeTagIndex: 0,
      isLoading: false,
      topicTags: [
        { id: 0, name: '热门' },
        { id: 1, name: '减压方法' },
        { id: 2, name: '情绪管理' },
        { id: 3, name: '睡眠' },
        { id: 4, name: '工作压力' },
        { id: 5, name: '人际关系' }
      ],
      posts: []
    };
  },
  onLoad() {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight;
    
    // 加载帖子数据
    this.loadPosts();
  },
  onReachBottom() {
    // 滚动到底部加载更多
    this.loadMorePosts();
  },
  methods: {
    // 加载帖子数据
    loadPosts() {
      this.isLoading = true;
      
      // 实际项目中应调用API获取数据
      // 这里使用模拟数据
      setTimeout(() => {
        this.isLoading = false;
        
        this.posts = [
          {
            id: 1,
            nickname: '心灵使者',
            avatar: '/static/images/placeholder.png',
            tag: '减压达人',
            content: '分享一个我最近在用的减压方法：每天下班后，花10分钟静坐冥想，专注呼吸，让思绪安静下来。坚持一周后，明显感觉睡眠质量提高了，焦虑感也减轻了不少。',
            images: ['/static/images/placeholder.png'],
            likes: 28,
            comments: 5,
            isLiked: false
          },
          {
            id: 2,
            nickname: '情绪管理师',
            avatar: '/static/images/placeholder.png',
            tag: '情绪达人',
            content: '工作压力大时，不妨试试"5-4-3-2-1"感官练习：看到5个东西，触摸4个物体，听到3种声音，闻到2种气味，尝到1种味道。这个简单的正念练习能迅速把你拉回当下，缓解焦虑。',
            images: [],
            likes: 45,
            comments: 12,
            isLiked: true
          },
          {
            id: 3,
            nickname: '睡眠专家',
            avatar: '/static/images/placeholder.png',
            tag: '睡眠指导',
            content: '失眠问题困扰了我很久，尝试了很多方法都没效果。直到我开始使用这个App的舒缓音乐功能，选择下雨的声音，每晚听着入睡，状态改善了很多！推荐给同样有睡眠困扰的朋友。',
            images: [
              '/static/images/placeholder.png',
              '/static/images/placeholder.png'
            ],
            likes: 36,
            comments: 8,
            isLiked: false
          }
        ];
      }, 1000);
    },
    
    // 加载更多帖子
    loadMorePosts() {
      if (this.isLoading) return;
      
      this.isLoading = true;
      
      // 实际项目中应调用API获取更多数据
      // 这里使用模拟数据
      setTimeout(() => {
        this.isLoading = false;
        
        // 模拟没有更多数据的情况
        if (this.posts.length >= 9) return;
        
        // 添加更多模拟数据
        const moreData = [
          {
            id: this.posts.length + 1,
            nickname: '冥想爱好者',
            avatar: '/static/images/placeholder.png',
            tag: '正念实践',
            content: '今天尝试了App里的正念冥想课程，引导语很专业，背景音乐也很舒缓。20分钟过去了，感觉整个人都轻松了不少。准备把它加入每日习惯！',
            images: ['/static/images/placeholder.png', '/static/images/placeholder.png', '/static/images/placeholder.png'],
            likes: 19,
            comments: 3,
            isLiked: false
          },
          {
            id: this.posts.length + 2,
            nickname: '阳光心态',
            avatar: '/static/images/placeholder.png',
            content: '压力检测结果显示我处于中度焦虑状态，App推荐的AI聊天功能真的很有帮助。它不仅耐心倾听，还给出了一些实用的建议，让我重新审视自己的压力源。',
            images: [],
            likes: 26,
            comments: 7,
            isLiked: false
          }
        ];
        
        this.posts = [...this.posts, ...moreData];
      }, 1000);
    },
    
    // 选择话题标签
    selectTag(index) {
      if (this.activeTagIndex === index) return;
      
      this.activeTagIndex = index;
      this.loadPosts(); // 重新加载对应标签的帖子
    },
    
    // 搜索
    handleSearch() {
      if (!this.searchKeyword.trim()) return;
      
      uni.showToast({
        title: '搜索: ' + this.searchKeyword,
        icon: 'none'
      });
      
      // 实际项目中应调用搜索API
    },
    
    // 点赞帖子
    likePost(post) {
      // 实际项目中应调用API进行点赞
      post.isLiked = !post.isLiked;
      post.likes += post.isLiked ? 1 : -1;
    },
    
    // 查看评论
    viewComments(post) {
      this.viewPostDetail(post);
    },
    
    // 分享帖子
    sharePost(post) {
      uni.showActionSheet({
        itemList: ['分享给好友', '复制链接', '收藏'],
        success: (res) => {
          uni.showToast({
            title: '分享功能开发中',
            icon: 'none'
          });
        }
      });
    },
    
    // 查看帖子详情
    viewPostDetail(post) {
      uni.navigateTo({
        url: `/pages/community/detail?id=${post.id}`
      });
    },
    
    // 创建新帖子
    createPost() {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再发布内容',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/user/login'
              });
            }
          }
        });
        return;
      }
      
      // 实际项目中应跳转到发帖页面
      uni.showToast({
        title: '发帖功能开发中',
        icon: 'none'
      });
    }
  }
};
</script>

<style scoped>
/* 可在此处添加页面特定样式 */
</style>
