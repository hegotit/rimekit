<template>
  <form class="form-horizontal">
    <div class="control-group">
      <label class="control-label" for="schemaId">輸入方案</label>
      <div class="controls">
        <input type="text" id="schemaId" v-model="schemaId" placeholder="Rime 輸入方案標識" />
      </div>
    </div>
    <div class="control-group">
      <label class="control-label" for="configKey">設定項</label>
      <div class="controls">
        <div class="input-append">
          <input type="text" id="configKey" v-model="configKey" placeholder="以 / 分隔的鍵值" />
          <button class="btn btn-primary" @click="loadSchema">載入設定</button>
        </div>
        <ul v-if="filteredConfigKeys.length">
          <li v-for="key in filteredConfigKeys" :key="key" @click="selectConfigKey(key)">
            {{ key }}
          </li>
        </ul>
      </div>
    </div>

    <div class="control-group" v-show="isProjector && rules?.length">
      <label class="control-label" for="dictName">詞典</label>
      <div class="controls">
        <div class="input-append">
          <input type="text" id="dictName" v-model="dictName" placeholder="與輸入方案關聯的詞典名" />
          <button class="btn" @click="loadDict">載入音節表</button>
        </div>
      </div>
    </div>
    <div class="control-group" v-show="isFormatter">
      <label class="control-label" for="testString">測試文字</label>
      <div class="controls">
        <input type="text" id="testString" v-model="testString" @input="calculate" />
      </div>
    </div>
  </form>
  <div v-for="(alert, index) in alerts" :key="index" class="span3 offset2" @close="closeAlert(index)">
    {{ alert.msg }}
  </div>
  <table class="table table-bordered table-striped" v-if="rules.length">
    <tr v-for="(rule, index) in rules" :key="index">
      <td @click="selectRule(index)">
        <div :class="`code error-${rule.error}`">{{ rule.formula }}</div>
        <Query v-if="isProjector && selectedIndex === index" :update="querySpellings" :visible="true" />
      </td>
      <td v-if="isProjector">
        <!--        :value="rule.queryResult"-->
        <Diff class="code" type="script" />
      </td>
      <td v-if="isFormatter">
        <Diff class="code" :value="rule.spelling" />
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Rule } from '@/rime/algebra';
import Diff from '@/components/Diff.vue';
import Query from '@/components/Query.vue';
// import * as fs from 'node:fs';
import { Config } from '@/rime/config';

// 定义传入组件的Props
// defineProps({
//   rules: Array,
//   isProjector: Boolean,
//   isFormatter: Boolean,
// });

const schemaId = ref('luna_pinyin');
const configKey = ref('speller/algebra');
const configKeys = ref<string[]>([
  'speller/algebra',
  'translator/preedit_format',
  'translator/comment_format',
  'reverse_lookup/preedit_format',
  'reverse_lookup/comment_format',
]);
const selectedIndex = ref(-1);
const filteredConfigKeys = ref<string[]>([]);
const isProjector = ref(false);
const rules = ref<Rule[]>([]);
const syllabary = ref([]);
const dictName = ref('');
const isFormatter = ref(false);
const testString = ref('');
const alerts = ref([{ type: 'error', msg: '示例警告消息' }]);

// 选择规则的方法
function selectRule(index: number) {
  selectedIndex.value = index;
}

const closeAlert = (index: number) => {
  alerts.value.splice(index, 1);
};

watch(configKey, (newValue) => {
  if (!newValue) {
    filteredConfigKeys.value = [];
    return;
  }
  filteredConfigKeys.value = configKeys.value.filter((key) => key.toLowerCase().includes(newValue.toLowerCase()));
});

const selectConfigKey = (key: string) => {
  configKey.value = key;
  filteredConfigKeys.value = [];
};

const loadSchema2 = () => {
  // 实现加载配置的逻辑
  console.log('加载配置:', configKey.value);
};

const loadSchema = async () => {
  rules.value = [];
  syllabary.value = [];
  alerts.value.length = 0;
  if (!schemaId.value || !configKey.value) {
    return;
  }
  let rimeUserDir;
  const filePath = `${rimeUserDir.value || '.'}/${schemaId.value}.schema.yaml`;
  // if (!fs.existsSync(filePath)) {
  //   // 前端项目中直接使用 fs 模块不可行，需要调整
  //   console.warn(`file does not exist: ${filePath}`);
  //   alerts.value.push({ type: 'error', msg: '找不到輸入方案' });
  //   return;
  // }
  const config = new Config();
  try {
    await config.loadFromFile(filePath);
    const dictName = ref(config.get('translator/dictionary') || '');
    const loadedRules = config.get(configKey.value);
    if (loadedRules) {
      rules.value = loadedRules.map((x) => new Rule(x));
      console.log(`${rules.value.length} rules loaded.`);
      if (rules.value.length !== 0) {
        // rules.value.unshift(new Rule()); // initial state
      }
      const isProjector = /\/algebra$/.test(configKey.value);
      const isFormatter = /format$/.test(configKey.value);
      // calculate(); // 确保你已经定义了 calculate 方法或逻辑
    }
  } catch (err) {
    alerts.value.push({ type: 'error', msg: '載入輸入方案錯誤' });
  }
};

const loadDict = () => {
  // 实现加载配置的逻辑
  console.log('加载配置:', configKey.value);
};

const calculate = () => {
  // 在这里实现calculate函数的逻辑
  console.log(testString.value); // 示例：打印当前testString的值
};
// const querySpellings = (index: number, query: any) => {
//   // 实现查询拼写逻辑
// };
// 更新查询拼写的方法，需按实际业务逻辑实现
function querySpellings(query: RegExp) {
  console.log('Updating spellings with query:', query);
  // 实现更新逻辑
}
</script>
