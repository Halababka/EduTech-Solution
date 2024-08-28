<template>
  <div>
    <div
        v-for="(parentItem, parentIndex) in parents"
        :key="parentItem.id"
        style="border: 1px solid black; margin-bottom: 10px;"
    >
      <div class="flex items-center">
        <strong>{{ parentItem.name }}</strong>
        <span
            @dragover.prevent
            @drop="handleDropParent(parentIndex)"
            style="margin-left: auto; cursor: move;"
        >↔️</span>
      </div>

      <div
          v-for="(childItem, childIndex) in parentItem.children"
          :key="childItem.id"
          @dragstart="handleDragStart(parentIndex, childIndex)"
          @drop="handleDropChild(parentIndex, childIndex)"
          @dragover.prevent
          draggable="true"
          style="padding: 5px; border: 1px solid gray; margin-bottom: 5px;"
      >
        {{ childItem.name }}
      </div>
    </div>
  </div>
</template>

<script setup>
const parents = ref([
  {
    id: 1,
    name: "Parent 1",
    children: [
      { id: 1, name: "Child 1" },
      { id: 2, name: "Child 2" },
      { id: 3, name: "Child 3" },
    ],
  },
  {
    id: 2,
    name: "Parent 2",
    children: [
      { id: 4, name: "Child 4" },
      { id: 5, name: "Child 5" },
      { id: 6, name: "Child 6" },
    ],
  },
]);
let draggingParentIndex = null;
let draggingChildIndex = null;

const handleDragStart = (parentIndex, childIndex) => {
  draggingParentIndex = parentIndex;
  draggingChildIndex = childIndex;
};

const handleDropChild = (targetParentIndex, targetChildIndex) => {
  if (targetParentIndex === draggingParentIndex) {
    const draggedItem = parents[draggingParentIndex].children.splice(draggingChildIndex, 1)[0];
    parents[targetParentIndex].children.splice(targetChildIndex, 0, draggedItem);
  }
  draggingParentIndex = null;
  draggingChildIndex = null;
};

const handleDropParent = (targetParentIndex) => {
  if (draggingParentIndex !== null && targetParentIndex !== draggingParentIndex) {
    const draggedParent = parents.splice(draggingParentIndex, 1)[0];
    parents.splice(targetParentIndex, 0, draggedParent);
    draggingParentIndex = targetParentIndex;
  }
};
</script>

<style>
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
</style>
