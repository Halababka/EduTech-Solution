<script setup lang="ts">
import AwCarouselItem from "~/components/ui-kit/AwCarouselItem.vue";
//
// const innerStyles = ref({})
const wrapper = ref(null)
const carousel = ref(null)
// const step = ref('')
// const transitioning = ref(false)
const overflowItem = ref(false)
// let stepSlide = 1
//
const props = defineProps({
  carousel_data: {
    type: Array,
    default: () => [],
  }
})

function nextSlide() {
  const card = props.carousel_data?.shift()
  props.carousel_data?.push(card)
}

function prevSlide() {
  const card = props.carousel_data?.pop()
  props.carousel_data?.unshift(card)
}

//
onMounted(() => {
  // console.log(props.carousel_data?.length)
  // console.log(wrapper.value.scrollWidth)
  // console.log('overflowItem',overflowItem.value.scrollWidth)
  // setStep() // Нету смысла, так как курсы загружаются позже, из родительского компонента
  if (overflowItem.value) {
    prevSlide()
  }
  // console.log(innerStyles)
  // innerStyles.value = {'margin-left': '-' + (step.value * currentSlideIndex.value) + 'px'}
  // console.log(innerStyles)
})

onUpdated(()=> {
  setStep()
})

//
function setStep() {
  let innerWidth = wrapper.value.scrollWidth
  let carouselWidth = carousel.value.offsetWidth
  if (innerWidth > carouselWidth) {
    overflowItem.value = true;
  }
  // let totalCards = props.carousel_data?.length
  // step.value = `${innerWidth / totalCards}px`
  // stepSlide = Math.ceil((Math.floor(carouselWidth / (innerWidth / totalCards))) / 3)
  // console.log(step.value)
  // console.log(innerStyles.value)
}

//
// function prevSlide() {
//   // if (currentSlideIndex.value <= 0) {
//   //   currentSlideIndex.value = props.carousel_data?.length - 1
//   //   // moveRight()
//   // } else {
//   //   currentSlideIndex.value--
//   // }
//   // innerStyles.value = {'margin-left': '-' + (step.value * currentSlideIndex.value) + 'px'}
//   // console.log(innerStyles.value)
//   // const card = props.carousel_data?.pop()
//   // props.carousel_data?.unshift(card)
//   // console.log(props.carousel_data)
//   if (transitioning.value) return
//
//   transitioning.value = true
//
//   moveRight()
//
//   afterTransition(() => {
//     const card = props.carousel_data?.pop()
//     props.carousel_data?.unshift(card)
//     resetTranslate()
//     transitioning.value = false
//   })
// }
//
// function nextSlide() {
//   // if (currentSlideIndex.value >= (props.carousel_data?.length - 1)) {
//   //   // currentSlideIndex.value = 0
//   //   // moveLeft()
//   // } else {
//   //   currentSlideIndex.value++
//   // }
//   // innerStyles.value = {'margin-left': '-' + (step.value * currentSlideIndex.value) + 'px'}
//   // const card = props.carousel_data?.shift()
//   // props.carousel_data?.push(card)
//   // console.log(props.carousel_data)
//   if (transitioning.value) return
//
//   transitioning.value = true
//
//   moveLeft()
//
//   afterTransition(() => {
//     // let firstThree = props.carousel_data?.slice(0, stepSlide)
//     // props.carousel_data?.splice(0, stepSlide)
//     // props.carousel_data?.push(...firstThree)
//     const card = props.carousel_data?.shift()
//     props.carousel_data?.push(card)
//     resetTranslate()
//     transitioning.value = false
//   })
// }
//
// function afterTransition(callback) {
//   const listener = () => {
//     callback()
//     wrapper.value.removeEventListener('transitionend', listener)
//   }
//   wrapper.value.addEventListener('transitionend', listener)
// }
//
// function moveLeft() {
//   innerStyles.value = {
//     'transform': `translateX(-${step.value})
//                   translateX(-${step.value})`
//   }
// }
//
// function moveRight() {
//   innerStyles.value = {
//     'transform': `translateX(${step.value})
//                   translateX(-${step.value})`
//   }
// }
//
// function resetTranslate() {
//   innerStyles.value = {
//     'transform': `translateX(-${step.value})`,
//     'transition': 'none',
//   }
// }
</script>

<template>
  <!--  <div id="carousel" ref="carousel">-->
  <!--    &lt;!&ndash;    <div class="wrapper" :style="{'margin-left': '-'+(step.value * currentSlideIndex) + '%'}" ref="wrapper">&ndash;&gt;-->
  <!--    <div class="wrapper" :style="innerStyles" ref="wrapper">-->
  <!--      <AwCarouselItem-->
  <!--          v-for="item in carousel_data" :key="item.id"-->
  <!--          :item_data="item"-->
  <!--      />-->
  <!--    </div>-->
  <!--    <div class="btn-group" v-if="overflowItem">-->
  <!--      <button @click="prevSlide">&lt;</button>-->
  <!--      <button @click="nextSlide">&gt;</button>-->
  <!--    </div>-->
  <!--  </div>-->
  <div id="carousel" ref="carousel">
    <!--    <div class="wrapper" :style="{'margin-left': '-'+(step.value * currentSlideIndex) + '%'}" ref="wrapper">-->
    <div class="wrapper" ref="wrapper">
        <AwCarouselItem
            v-for="item in carousel_data" :key="item.id"
            :item_data="item"
        />
    </div>
    <div class="btn-group" v-if="overflowItem">
      <button @click="prevSlide">&lt;</button>
      <button @click="nextSlide">&gt;</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/main.scss' as *;

#carousel {
  width: min-content;
  overflow: hidden;
  min-width: min-content;
}

.wrapper {
  display: flex;
  width: 100%;
  height: auto;
  padding: 10px 0;
  transition: 0.1s;
}

.btn-group button {
  padding: 10px;
  border: none;
  border-radius: 10px;
  background-color: $blue;
  color: white;
  min-width: 50px;
}

.btn-group button:hover {
  background-color: $blue-mate;
}
</style>