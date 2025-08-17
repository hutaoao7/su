<script>
export default {
  onLaunch: function() {
    console.log('App Launch (SafeBoot)');
  },
  onShow: function() {
    console.log('App Show (SafeBoot)');
  },
  onHide: function() {
    console.log('App Hide (SafeBoot)');
  }
}
</script>
<style>
@import "@/uni.scss";
page, body {
  background-color: #ffffff;
}
</style>