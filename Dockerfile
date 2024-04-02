# 基础镜像
FROM nginx:1.22.1
# author
MAINTAINER sskj

# 设置时区
RUN rm -f /etc/localtime \
&& ln -sv /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
&& echo "Asia/Shanghai" > /etc/timezone

# 挂载目录
VOLUME /home/sskj/projects/sskj-ui
# 创建目录
RUN mkdir -p /home/sskj/projects/sskj-ui
# 指定路径
WORKDIR /home/sskj/projects/sskj-ui
# 复制conf文件到路径
COPY ./nginx/conf/nginx.conf /etc/nginx/nginx.conf
# 复制html文件到路径
COPY ./dist /home/sskj/projects/sskj-ui
