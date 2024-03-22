<script setup lang="ts">
import { useRouter } from 'vue-router';
const links = {
  blog: 'http://rimeime.github.io',
  project: 'https://rime.im/',
};
const router = useRouter();
const toggleActiveTab = async (tabPath: string) => {
  await router.push(tabPath);
};
const openLink = (url: string) => {
  window.open(url, '_blank')?.focus();
};
</script>

<template>
  <el-container>
    <el-header height="20px">
      <nav>
        <router-link to="/plum">东风破</router-link> | <router-link to="/debugger">拼寫運算調試器</router-link> |
        <router-link to="/cseditor">配色編輯器</router-link> |
        <router-link to="/credits">創作者</router-link>
      </nav>
    </el-header>
    <el-main>
      <div class="text-center">
        <h2>Rime 工具箱 <small>分享打字的樂趣</small></h2>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="description">
              <p>方案浩如星 碼表源淸平</p>
              <p>配方隨性揀 設定遂能成</p>
            </div>
          </el-col>
        </el-row>
        <el-button
          type="primary"
          color="#3182ce"
          size="large"
          style="
            padding: 10px 20px;
            margin-top: 5px;
            :hover {
              background-color: #2c5282;
            }
          "
          @click="toggleActiveTab('plum')"
        >
          開始
        </el-button>
      </div>
    </el-main>
    <el-footer>
      <div>
        <el-row :gutter="12" justify="space-evenly">
          <el-col :span="12">
            <el-button plain type="primary" @click="openLink(links.project)">Rime 主頁</el-button>
          </el-col>
          <el-col :span="12">
            <el-button plain type="primary" @click="openLink(links.blog)">Rime Blog</el-button>
          </el-col>
        </el-row>
      </div>
    </el-footer>
  </el-container>
</template>

<style scoped>
.text-center {
  text-align: center;
  padding: 20px;
}

.text-center h2 {
  color: #1a202c;
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 20px;
}

.el-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 1200px;
  max-height: 410px;
  margin: 0 auto;
  padding: 20px;
  background: #f9f9f9;
  /*  border-radius: 8px;*/
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.06);
  /*  0 2px 4px -1px rgba(0, 0, 0, 0.06);*/
}

.description {
  padding: 0;
  text-align: center;
}

.description p {
  /*  color: #606266;*/
  color: #4a5568;
  margin: 5px 0 15px;
  font-size: 16px;
}

@media (max-width: 600px) {
  .text-center h2 {
    font-size: 20px;
  }
}
</style>
