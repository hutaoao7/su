<template>
  <view class="container">
    <u-toast ref="uToast"></u-toast>
    <view class="card">
      <u-form :model="form" ref="uForm">
        <u-form-item label="兑换码" prop="code" label-width="auto">
          <u-input v-model="code" placeholder="请输入或粘贴兑换码" />
        </u-form-item>
      </u-form>
      <u-button @click="submit" type="primary" :loading="loading" style="margin-top: 20px;">
        立即兑换
      </u-button>
    </view>
    <view v-if="message" class="result-card" :class="messageType">
      <text>{{ message }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      code: '',
      loading: false,
      message: '',
      messageType: 'success' // 'success' or 'error'
    };
  },
  methods: {
    async submit() {
      if (!this.code.trim()) {
        this.$refs.uToast.show({
          title: '请输入兑换码',
          type: 'warning'
        });
        return;
      }
      
      const token = uni.getStorageSync('uni_id_token');
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '您尚未登录，请先登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: '/pages/login/login'
              });
            }
          }
        });
        return;
      }

      this.loading = true;
      this.message = '';

      try {
        const res = await uniCloud.callFunction({
          name: 'cdk-redeem',
          data: {
            code: this.code.trim()
          }
        });

        if (res.result) {
          const { code, msg } = res.result;
          this.handleResult(code, msg);
        } else {
            this.messageType = 'error';
            this.message = '兑换失败，请稍后再试。';
        }
      } catch (err) {
        console.error('cdk-redeem call failed', err);
        const code = err.code || (err.result && err.result.code);
        if (code === 401 || (err.message && err.message.includes('401'))) {
             this.handleResult(401);
        } else {
            this.messageType = 'error';
            this.message = err.message || '请求失败，请检查网络';
        }
      } finally {
        this.loading = false;
      }
    },
    handleResult(code, defaultMsg = '') {
      switch (code) {
        case 0:
          this.messageType = 'success';
          this.message = '兑换成功！';
          this.code = ''; // Clear input on success
          break;
        case 1001:
          this.messageType = 'error';
          this.message = '兑换码无效';
          break;
        case 1002:
          this.messageType = 'error';
          this.message = '兑换码已过期';
          break;
        case 1003:
          this.messageType = 'error';
          this.message = '兑换码已被使用';
          break;
        case 1004:
          this.messageType = 'error';
          this.message = '操作过于频繁，请稍后再试';
          break;
        case 401:
            this.messageType = 'error';
            this.message = '未登录或登录已过期';
            uni.showModal({
                title: '提示',
                content: '您尚未登录或登录已过期，请先登录',
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({
                            url: '/pages/login/login'
                        });
                    }
                }
            });
            break;
        default:
          this.messageType = 'error';
          this.message = defaultMsg || '未知错误';
          break;
      }
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
}
.card {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.result-card {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}
.success {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #e1f3d8;
}
.error {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
}
</style>