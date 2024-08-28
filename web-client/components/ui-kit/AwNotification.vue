<script setup lang="ts">

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  rightButton: {
    type: String,
    default: ''
  },
  leftButton: {
    type: String,
    default: ''
  },
  timeout: {
    type: Number,
    default: 3000
  }
})

function hideNotification() {
  if (props.messages?.length) {
    setTimeout(() => {
      props.messages?.splice(props.messages?.length - 1, 1)
    }, props.timeout)
  }
}

onMounted(() => {
  hideNotification()
})

watch(() => props.messages?.length, () => {
  hideNotification()
});
</script>

<template>
  <div class='v-notification'>
    <TransitionGroup
        name="v-transition-animate"
        tag="div"
        class="messages_list"
    >
      <div
          class="v-notification__content"
          v-for="message in messages"
          :key="message.id"
          :class="message.icon"
      >
        <div class="content__text">
          <span>{{ message.name }}</span>
          <div :class="`icon-${message.icon} material-icons`"></div>
        </div>
        <div class="content_buttons">
          <button v-if="rightButton.length">{{ rightButton }}</button>
          <button v-if="leftButton.length">{{ leftButton }}</button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
.v-notification {
  position: fixed;
  top: 80px;
  right: 16px;
  z-index: 10;

  &__messages_list {
    display: flex;
    flex-direction: column-reverse;
  }

  &__content {
    padding: 16px;
    border-radius: 4px;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    margin-bottom: 16px;
    background: green;

    &.error {
      background: red;
    }

    &.warning {
      background: orange;
    }

    &.check_circle {
      background: green;
    }
  }

  .content {
    &__text {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }

  .material-icons {
    margin-left: 16px;
  }
}

.v-transition-animate {
  &-enter {
    transform: translateX(120px);
    opacity: 0;
  }

  &-enter-active {
    transition: all .6s ease;
  }

  &-enter-to {
    opacity: 1;
  }

  &-leave {
    height: 50px;
    opacity: 1;
  }

  &-leave-active {
    transition: transform .6s ease, opacity .6s, height .6s .2s;
  }

  &-leave-to {
    height: 0;
    transform: translateX(120px);
    opacity: 0;
  }

  &-move {
    transition: transform .6s ease;
  }

}
</style>